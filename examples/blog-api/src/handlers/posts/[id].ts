import type { Handler } from '@gati-framework/runtime';

// GET /api/posts/:id - Get single post
// PUT /api/posts/:id - Update post  
// DELETE /api/posts/:id - Delete post
export const handler: Handler = async (req, res, gctx, lctx) => {
  const db = gctx.modules['database'];
  const auth = gctx.modules['auth'];
  const postId = req.params.id;

  try {
    if (req.method === 'GET') {
      // Get single post
      const post = await db.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({ post });
      
    } else if (req.method === 'PUT') {
      // Update post - requires authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await auth.requireRole(token, 'author');
      
      const post = await db.getPostById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user owns the post or is admin
      if (post.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to edit this post' });
      }

      const { title, content, published } = req.body;
      const updated = await db.updatePost(postId, { title, content, published });
      
      res.json({ post: updated });
      
    } else if (req.method === 'DELETE') {
      // Delete post - requires authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await auth.requireRole(token, 'author');
      
      const post = await db.getPostById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user owns the post or is admin
      if (post.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }

      await db.deletePost(postId);
      res.status(204).send();
      
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