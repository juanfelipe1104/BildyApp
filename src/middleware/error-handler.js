const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(err.details && { detalles: err.details })
        });
    }

    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: 'Error interno del servidor',
        ...(isDev && { stack: err.stack, message: err.message })
    });
};

export default errorHandler;