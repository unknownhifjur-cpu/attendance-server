export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next({
      statusCode: 400,
      message: "Validation failed",
      details: result.error.flatten().fieldErrors,
      isOperational: true,
    });
  }
  req.body = result.data;
  next();
};