import nodemailer from 'nodemailer';
import { parseConnectionUrl } from 'nodemailer/lib/shared';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type { Config } from './config.js';
import { journal, messageNettoye } from './journal.js';

export type ResetMail = { to: string; url: string };
export type Mailer = (mail: ResetMail) => Promise<void>;

export async function avecEssais<T>(fn: () => Promise<T>, attentesMs: number[]): Promise<T> {
  for (let essai = 0; ; essai++) {
    try { return await fn(); }
    catch (error) {
      if (essai >= attentesMs.length) throw error;
      await new Promise(resolve => setTimeout(resolve, attentesMs[essai]));
    }
  }
}

export function creerTransport(config: Config) {
  if (config.smtpURL) {
    const url = new URL(config.smtpURL);
    const options: SMTPTransport.Options | undefined = config.production ? {
      requireTLS: url.protocol !== 'smtps:' && url.port !== '465',
      secure: url.protocol === 'smtps:' || url.port === '465',
      tls: { rejectUnauthorized: true },
    } : undefined;
    // Le second argument de createTransport ne configure que les courriels.
    return options ? nodemailer.createTransport({ ...parseConnectionUrl(config.smtpURL), ...options })
      : nodemailer.createTransport(config.smtpURL);
  }
  if (!config.smtpHost) return undefined;
  return nodemailer.createTransport({ host: config.smtpHost, port: config.smtpPort,
    secure: config.smtpPort === 465, auth: { user: config.smtpUser, pass: config.smtpPass },
    ...(config.production ? { requireTLS: config.smtpPort !== 465, tls: { rejectUnauthorized: true } } : {}),
  });
}

export function creerEnvoi(config: Config): Mailer {
  const transport = creerTransport(config);
  return async ({ to, url }) => {
    if (!transport) {
      if (config.production) throw new Error('SMTP indisponible.');
      console.info(`Lien de réinitialisation (développement) : ${url}`); // jamais en production : le lien contient le jeton
      return;
    }
    try {
      await avecEssais(() => transport.sendMail({ from: config.mailFrom, to,
        subject: 'Réinitialisation de votre mot de passe',
        text: `Pour choisir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nCe lien est valable une heure et une seule fois. Si vous n’avez rien demandé, ignorez cet e-mail.`,
      }), [1000, 3000]);
    } catch (error) {
      journal('smtp-echec', { niveau: 'erreur', message: messageNettoye(error) });
      throw new Error('Impossible d’envoyer le message de réinitialisation.');
    }
  };
}
