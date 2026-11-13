export function notFound(req, res) { res.status(404).json({ message: 'Endpoint not found.' }); }
export function errorHandler(err, req, res, next) {
  console.error(err.message);
  if (err.name === 'MulterError' || /Use a JPG|Upload a CSV/.test(err.message)) err.status = 400;
  if (err.code === 11000) { err.status = 409; err.message = 'That username or email is already registered.'; }
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ message: status === 500 ? 'An unexpected server error occurred.' : err.message });
}
