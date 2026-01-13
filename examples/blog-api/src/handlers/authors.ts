import type { Handler } from '@gati-framework/runtime';

// GET /api/authors - List all authors
// POST /api/authors - Create new author
export const handler: Handler = async (req, res, gctx, lctx) => {
  const db = gctx.modules['database'];
  const auth = gctx.modules['auth'];

  try {
    if (req.method === 'GET') {
      // List authors
      const authors = await db.getAllAuthors();
      res.json({ authors });
      
    } else if (req.method === 'POST') {
      // Create author - requires admin role
      const token = req.headers.authorization?.replace('Bearer ', '');
      await auth.requireRole(token, 'admin');
      
      const { name, email, bio } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ 
          error: 'Name and email are required' 
        });
      }

      const author = await db.createAuthor({ name, email, bio });
      res.status(201).json({ author });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    if (error.message.includes('Authentication') || error.message.includes('token')) {
      res.status(401).json({ error: error.message });
    } else if (error.message.includes('Role')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};