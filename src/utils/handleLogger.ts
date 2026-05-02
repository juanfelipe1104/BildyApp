import { IncomingWebhook } from '@slack/webhook';
import type { Request } from "express";
import env from '../config/env.js';

type SlackErrorPayload = {
    req: Request;
    statusCode: number;
    message: string;
    code?: string | null;
    stack?: string;
};

const webhookUrl = env.SLACK_WEBHOOK;

const webhook = webhookUrl ? new IncomingWebhook(webhookUrl) : null;

export const loggerStream = {
    write: (message: string): boolean => {
        console.error(message);
        return true;
    }
};

const sendSlackNotification = async (message: string): Promise<void> => {
    if (!webhook) {
        console.log('Webhook no configurado');
        return;
    }

    try {
        await webhook.send({ text: message });
        console.log('Mensaje enviado a Slack');
    } catch (err: unknown) {
        console.error('Error enviando a Slack:', err);
    }
};

export const sendSlackError = async ({ req, statusCode, message, code, stack }: SlackErrorPayload): Promise<void> => {
    if (env.NODE_ENV === "test" || !webhook || statusCode < 500) {
        return;
    }

    const text = [
        "*Error 5XX en API*",
        `*Timestamp:* ${new Date().toISOString()}`,
        `*Método:* ${req.method}`,
        `*Ruta:* ${req.originalUrl}`,
        `*Status:* ${statusCode}`,
        `*Código:* ${code ?? "INTERNAL_ERROR"}`,
        `*Mensaje:* ${message}`,
        stack ? `*Stack:*\n\`\`\`${stack.slice(0, 2500)}\`\`\`` : null
    ].filter(Boolean).join("\n");

    await sendSlackNotification(text);
};