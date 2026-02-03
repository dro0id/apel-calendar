import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface BookingEmailData {
  guestName: string
  guestEmail: string
  hostName: string
  hostEmail: string
  eventTitle: string
  startTime: Date
  endTime: Date
  meetingLink?: string
  guestTimezone: string
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const formattedDate = format(data.startTime, "EEEE d MMMM yyyy", { locale: fr })
  const formattedTime = `${format(data.startTime, "HH:mm")} - ${format(data.endTime, "HH:mm")}`

  // Email to guest
  const guestMailOptions = {
    from: process.env.EMAIL_FROM,
    to: data.guestEmail,
    subject: `Confirmation: ${data.eventTitle} avec ${data.hostName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Votre rendez-vous est confirmé!</h2>
        <p>Bonjour ${data.guestName},</p>
        <p>Votre rendez-vous a été réservé avec succès.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.eventTitle}</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Heure:</strong> ${formattedTime} (${data.guestTimezone})</p>
          <p><strong>Avec:</strong> ${data.hostName}</p>
          ${data.meetingLink ? `<p><strong>Lien de réunion:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
        </div>

        <p>À bientôt!</p>
      </div>
    `,
  }

  // Email to host
  const hostMailOptions = {
    from: process.env.EMAIL_FROM,
    to: data.hostEmail,
    subject: `Nouveau rendez-vous: ${data.eventTitle} avec ${data.guestName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Nouveau rendez-vous!</h2>
        <p>Bonjour ${data.hostName},</p>
        <p>Vous avez un nouveau rendez-vous.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.eventTitle}</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Heure:</strong> ${formattedTime}</p>
          <p><strong>Invité:</strong> ${data.guestName} (${data.guestEmail})</p>
        </div>
      </div>
    `,
  }

  try {
    await Promise.all([
      transporter.sendMail(guestMailOptions),
      transporter.sendMail(hostMailOptions),
    ])
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendCancellationEmail(data: BookingEmailData & { cancelReason?: string }) {
  const formattedDate = format(data.startTime, "EEEE d MMMM yyyy", { locale: fr })
  const formattedTime = `${format(data.startTime, "HH:mm")} - ${format(data.endTime, "HH:mm")}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: data.guestEmail,
    subject: `Annulation: ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rendez-vous annulé</h2>
        <p>Bonjour ${data.guestName},</p>
        <p>Votre rendez-vous a été annulé.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.eventTitle}</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Heure:</strong> ${formattedTime}</p>
          ${data.cancelReason ? `<p><strong>Raison:</strong> ${data.cancelReason}</p>` : ''}
        </div>

        <p>Vous pouvez réserver un nouveau créneau à tout moment.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending cancellation email:', error)
    return false
  }
}
