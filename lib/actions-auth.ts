"use server";

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

/**
 * Envoie un lien de réinitialisation de mot de passe via Nodemailer.
 * On utilise l'API Admin Supabase pour générer le lien de récupération
 * manuellement, afin de court-circuiter l'envoi d'e-mail par défaut de Supabase
 * et utiliser notre propre serveur SMTP (ex: Gmail).
 */
export async function reinitialiserMotDePasse(email: string, origin: string) {
  try {
    // 1. Initialiser le client Supabase avec la clé service_role pour l'API Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 2. Générer le lien de récupération
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${origin}/auth/confirm?next=/mot-de-passe-nouveau`,
      },
    });

    if (error || !data?.properties?.action_link) {
      // Pour des raisons de sécurité, on ne signale pas si l'utilisateur existe ou non.
      console.error("Erreur génération lien (ou user inexistant):", error);
      return; 
    }

    const lien = data.properties.action_link;

    // 3. Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 4. Envoyer l'e-mail
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Nova Assist" <noreply@novaassist.cm>',
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      text: `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :\n\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.\n\nL'équipe Nova Assist.`,
      html: `
        <div style="font-family: sans-serif; color: #0b1f3a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c9a227;">Nova Assist</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe sur votre espace client.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
          <div style="margin: 30px 0;">
            <a href="${lien}" style="background-color: #0b1f3a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <a href="${lien}">${lien}</a>
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 40px;">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
          </p>
        </div>
      `,
    });

  } catch (err) {
    console.error("Erreur envoi email nodemailer:", err);
  }
}
