import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, seedDatabase } from './src/db/localMongo';
import { performPoliticianResearch, answerFollowUpQuestion } from './src/services/researchAgent';

// Load environment variables
dotenv.config();

// Seed initial database
seedDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get directory stats for Badge indicators
  app.get('/api/stats', (req, res) => {
    try {
      const politicians = db.politicians.find();
      const totalProfiles = politicians.length;
      
      // Calculate total unique sources listed across all cached politicians
      const sourceUrls = new Set<string>();
      politicians.forEach(p => {
        p.sources.forEach(s => {
          if (s.url) sourceUrls.add(s.url);
        });
      });

      res.json({
        totalProfiles,
        totalSources: sourceUrls.size || 5, // fallback to spec baseline of 5 sources
        sourceGrounded: '100% Source-Grounded'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to aggregate library stats' });
    }
  });

  // Get list of all profiled politicians with support for searching, filtering, and sorting
  app.get('/api/profiles', (req, res) => {
    try {
      const { query, state, party, sort } = req.query;

      let results = db.politicians.find();

      // Search filters
      if (query && typeof query === 'string' && query.trim() !== '') {
        const q = query.toLowerCase();
        results = results.filter(p => 
          p.fullName.toLowerCase().includes(q) || 
          p.aliases.some(alias => alias.toLowerCase().includes(q)) ||
          (p.currentPosition && p.currentPosition.toLowerCase().includes(q))
        );
      }

      // State filters
      if (state && typeof state === 'string' && state !== 'State: All') {
        const stateVal = state.toLowerCase();
        results = results.filter(pol => pol.stateOfOrigin.toLowerCase().includes(stateVal));
      }

      // Party filters
      if (party && typeof party === 'string' && party !== 'Party: All') {
        const partyVal = party.toLowerCase();
        results = results.filter(pol => pol.currentParty.toLowerCase() === partyVal);
      }

      // Sort
      if (sort && typeof sort === 'string') {
        if (sort === 'Data Completeness' || sort === 'least-complete') {
          results.sort((a, b) => b.completenessPercentage - a.completenessPercentage);
        } else if (sort === 'Recent Updates') {
          results.sort((a, b) => new Date(b.lastResearched).getTime() - new Date(a.lastResearched).getTime());
        } else {
          // Default: Relevance / Alphabetical
          results.sort((a, b) => a.fullName.localeCompare(b.fullName));
        }
      } else {
        // Default sort alphabetical
        results.sort((a, b) => a.fullName.localeCompare(b.fullName));
      }

      res.json(results);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch profiles directory' });
    }
  });

  // Fetch unique State of Origin list for UI filter dropdowns
  app.get('/api/states', (req, res) => {
    try {
      const politicians = db.politicians.find();
      const uniqueStates = Array.from(new Set(politicians.map(p => {
        // Standardise FCT or Lagos State
        return p.stateOfOrigin;
      }))).filter(Boolean).sort();
      res.json(uniqueStates);
    } catch (e) {
      res.json([]);
    }
  });

  // Fetch unique political party list for UI filter dropdowns
  app.get('/api/parties', (req, res) => {
    try {
      const politicians = db.politicians.find();
      const uniqueParties = Array.from(new Set(politicians.map(p => p.currentParty))).filter(Boolean).sort();
      res.json(uniqueParties);
    } catch (e) {
      res.json([]);
    }
  });

  // Get specific Politician Dossier details
  app.get('/api/profile/:id', (req, res) => {
    try {
      const { id } = req.params;
      const profile = db.politicians.findOne(p => p.id === id);
      if (!profile) {
        return res.status(404).json({ error: 'Politician profile not found' });
      }
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: 'Internal DB query error' });
    }
  });

  // Live Research agent stream endpoint using SSE (Server-Sent Events)
  app.get('/api/research', async (req, res) => {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      res.status(400).write('data: ' + JSON.stringify({ error: 'Politician target name query is required' }) + '\n\n');
      return res.end();
    }

    // Set connection headers for Server Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // bypass proxy buffering
    });

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Callback when agent finishes a thinking/reasoning step
    const onAgentStep = (step: any) => {
      sendEvent('agent-step', step);
    };

    try {
      await performPoliticianResearch(name, onAgentStep);
    } catch (err) {
      sendEvent('agent-step', {
        type: 'OBSERVATION',
        text: `Internal Agent system oversight: ${err instanceof Error ? err.message : String(err)}`
      });
      sendEvent('agent-step', {
        type: 'COMPLETE',
        text: 'error'
      });
    } finally {
      res.end();
    }
  });

  // Ask any follow up questions on the loaded political profile
  app.post('/api/profile/:id/question', async (req, res) => {
    try {
      const { id } = req.params;
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question content cannot be empty' });
      }

      const profile = db.politicians.findOne(p => p.id === id);
      if (!profile) {
        return res.status(404).json({ error: 'Politician profile not found to query' });
      }

      const answer = await answerFollowUpQuestion(profile, question);
      res.json(answer);
    } catch (e) {
      res.status(500).json({ error: 'Follow-up consultation errored out' });
    }
  });

  // --- VITE MIDDLEWARE CONFIGURATION ---

  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite in development middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve pre-compiled files cleanly inside dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen exclusively to port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PolitiTrace Service operational on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
