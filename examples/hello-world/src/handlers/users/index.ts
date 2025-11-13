import type { Handler } from '@gati-framework/runtime';

export const METHOD = 'POST';
export const ROUTE = '/';

export const createUserHandler: Handler = async (req, res, _gctx, lctx) => {
  const userData = req.body;
  
  // Set typed state
  lctx.state.user = { id: 'new-user', ...(userData as object) };
  lctx.state.authenticated = true;
  
  res.status(201).json({
    user: lctx.state.user,
    requestId: lctx.requestId
  });
};