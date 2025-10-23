import { Request, Response, NextFunction } from 'express';

// Interfaccia per estendere l'oggetto Error standard di Node.js
interface CustomError extends Error {
    statusCode?: number;
    code?: number; // Per errori di MongoDB (es. duplicati)
    keyValue?: any; // Per errori di MongoDB (es. duplicati)
    errors?: any; // Per errori di validazione di Mongoose
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    // Usa lo statusCode dell'errore se presente, altrimenti default a 500 (Internal Server Error)
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Gestione di errori specifici di Mongoose per risposte più chiare

    // Errore di Cast: ID non nel formato corretto
    if (err.name === 'CastError') {
        message = `ID non valido.`;
        statusCode = 400; // Bad Request
    }

    // Errore di chiave duplicata
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `Valore duplicato per il campo '${field}'. Inserire un valore diverso.`;
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
    });
};

export default errorHandler;