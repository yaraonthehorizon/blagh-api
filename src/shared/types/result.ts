import { ResponseCode, AuditMessageType } from '../constants/enums';

export class Result<T = any> {
    constructor(
        data: any, 
        statusCode: ResponseCode, 
        errors: any[] = [], 
        messages: any[] = null, 
        requestIdentifier: string = null, 
        additionalInfo: any = null, 
        user: any = null
    ) {
        this.data = data;
        this.statusCode = statusCode;
        this.errors = errors;
        this.messages = messages;
        this.requestIdentifier = requestIdentifier;
        this.additionalInfo = additionalInfo;
        this.user = user;
    }

    data: T;
    statusCode: ResponseCode;
    errors: any[];
    requestIdentifier: string;
    messages: any[];
    additionalInfo: any;
    user: any;
    message: string;

    addMessage = (type: AuditMessageType, className: string, methodName: string, message: string) => {
        if (!this.messages) {
            this.messages = [];
        }
        this.messages.push({
            requestIdentifier: this.requestIdentifier,
            logtime: new Date(),
            type: type,
            className: className,
            methodName: methodName,
            message: message
        });
    };

    addException = (className: string, methodName: string, ex: any) => {
        if (!this.errors) {
            this.errors = [];
        }
        this.errors.push({
            requestIdentifier: this.requestIdentifier,
            logtime: new Date(),
            type: AuditMessageType.exception,
            className: className,
            methodName: methodName,
            message: ex
        });
    };

    static success<T>(data: T, requestIdentifier?: string): Result<T> {
        return new Result(data, ResponseCode.Ok, [], null, requestIdentifier);
    }

    static error(message: string, requestIdentifier?: string): Result<any> {
        return new Result(null, ResponseCode.Error, [{ message }], null, requestIdentifier);
    }

    static unauthorized(message: string = 'Unauthorized', requestIdentifier?: string): Result<any> {
        return new Result(null, ResponseCode.Unauthorized, [{ message }], null, requestIdentifier);
    }

    static notFound(message: string = 'Not found', requestIdentifier?: string): Result<any> {
        return new Result(null, ResponseCode.NotExist, [{ message }], null, requestIdentifier);
    }

    static duplicate(message: string = 'Duplicate entry', requestIdentifier?: string): Result<any> {
        return new Result(null, ResponseCode.Duplicate, [{ message }], null, requestIdentifier);
    }

    static incomplete(message: string = 'Incomplete data', requestIdentifier?: string): Result<any> {
        return new Result(null, ResponseCode.Incompelete, [{ message }], null, requestIdentifier);
    }

    static missingFields(message: string = 'Missing required fields', requestIdentifier?: string): Result<any> {
        return new Result(null, ResponseCode.MissingRequiredFields, [{ message }], null, requestIdentifier);
    }
} 