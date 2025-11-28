import type { Handler } from '@gati-framework/runtime';

export const METHOD = 'GET';
export const ROUTE = '/:id';

export const getUserHandler: Handler = async (req, res, _gctx, lctx) => {
  const userId = req.params.id;
  
  // Set typed state
  lctx.state.user = { id: userId, name: 'John Doe' };
  lctx.state.authenticated = true;
  
  res.json({
    user: lctx.state.user,
    requestId: lctx.requestId
  });
};