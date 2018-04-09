import { INotificationManager } from "../../interfaces/inotificationmanager";
import * as request from "request";
import Constants from "../../constants";

export class TelegramNotificationManager implements INotificationManager {

  private readonly TelegramWebhookUrl = `https://api.telegram.org/bot${Constants.BotToken}/sendMessage`;

  public SendNotification(message: string) {
    request({
      url: this.TelegramWebhookUrl,
      method: "POST",
      form: {
        chat_id: Constants.ChatId,
        text: message
      }
    });
  }

}