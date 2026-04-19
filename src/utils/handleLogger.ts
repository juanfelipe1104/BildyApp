import { IncomingWebhook } from '@slack/webhook';
import env from '../config/env.js';

const webhookUrl = env.SLACK_WEBHOOK;

const webhook = webhookUrl ? new IncomingWebhook(webhookUrl) : null;

export const loggerStream = {
    write: (message: string): boolean => {
        if (webhook) {
            webhook.send({
                text: `Errror en API ${message}`,
            }).then(() => {
                console.log('Mensaje enviado a Slack');
            }).catch((err: unknown) => {
                console.error('Error enviando a Slack:', err);
            });
        } else {
            console.log('Webhook no configurado');
        }
        console.error(message);
        return true;
    }
};

export const sendSlackNotification = async (message: string): Promise<void> => {
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