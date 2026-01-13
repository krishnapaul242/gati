import type { Handler } from '@gati-framework/runtime';

// GET /api/posts - List all posts
// POST /api/posts - Create new post
export const handler: Handler = async (req, res, gctx, lctx) => {
  const db = gctx.modules['database'];
  const auth = gctx.modules['auth'];

  try {
    if (req.method === 'GET') {
      // List posts
      const published = req.query.published === 'true' ? true : 
                       req.query.published === 'false' ? false : undefined;
      
      const posts = await db.getAllPosts(published);
      res.json({ posts });
      
    } else if (req.method === 'POST') {
      // Create post - requires authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await auth.requireRole(token, 'author');
      
      const { title, content, published = false } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ 
          error: 'Title and content are required' 
        });
      }

      const post = await db.createPost({
        title,
        content,
        authorId: user.id,
        published
      });

      res.status(201).json({ post });
      
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