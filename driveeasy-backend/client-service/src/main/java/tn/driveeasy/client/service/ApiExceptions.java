package tn.driveeasy.client.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

class NotFoundException extends RuntimeException { NotFoundException(String message) { super(message); } }
class ConflictException extends RuntimeException { ConflictException(String message) { super(message); } }

@RestControllerAdvice
public class ApiExceptions {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptions.class);

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ProblemDetail notFound(NotFoundException ex) { return detail(HttpStatus.NOT_FOUND, ex.getMessage()); }

    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    ProblemDetail conflict(ConflictException ex) { return detail(HttpStatus.CONFLICT, ex.getMessage()); }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ProblemDetail badRequest(Exception ex) {
        String message = ex instanceof MethodArgumentNotValidException validation
                ? validation.getBindingResult().getFieldErrors().stream()
                    .map(error -> error.getField() + ": " + error.getDefaultMessage()).findFirst().orElse("Requête invalide.")
                : ex.getMessage();
        return detail(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ProblemDetail unreadable(HttpMessageNotReadableException ex) {
        return detail(HttpStatus.BAD_REQUEST, "Corps de requête JSON invalide ou mal formé.");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    ProblemDetail internalError(Exception ex) {
        log.error("Erreur interne lors du traitement de la requête", ex);
        return detail(HttpStatus.INTERNAL_SERVER_ERROR, "Une erreur interne est survenue.");
    }

    private ProblemDetail detail(HttpStatus status, String message) { return ProblemDetail.forStatusAndDetail(status, message); }
}
