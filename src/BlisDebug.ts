import * as builder from 'botbuilder';
import { Utils } from './Utils';

export class BlisDebug {

    public static bot : any;
    public static address : any;
    public static cache : string = "";
    public static enabled : boolean;
    public static verbose : boolean = true;

    public static InitLogger(bot : builder.UniversalBot)
    {
        this.bot = bot;
    }
    
    public static SetAddress(address : any)
    {
        this.address = address;
        this.SendCache();
    }  
 
    private static SendCache() {
        if (this.bot && this.address && this.cache)
        {
            var msg = new builder.Message().address(this.address);
            msg.text(this.cache);
            this.cache = "";
            this.bot.send(msg);
        }
    }

     public static Log(text : string) {
        if (this.enabled)
        {
            this.cache += (this.cache ? "\n\n" : "") + text;
        }
        this.SendCache();

        console.log(text);
    }

    public static LogRequest(method : string, path : string, payload : any) {
        if (this.enabled)
        {
            let text = JSON.stringify(payload.body);
            this.cache += (this.cache ? "\n\n" : "") + method + ": //" + path + "\n\n" + (text ? text : "");
        }
        this.SendCache();

        console.log(path);
    }

    public static Error(error : any) : string {
        let text = Utils.ErrorString(error);
        BlisDebug.Log(`ERROR: ${text}`);
        return text;
    }

    public static Verbose(text : string) {
        if (this.verbose)
        {
            BlisDebug.Log(`${text}`);
        }
    }

    public static LogObject(obj : any) {
        this.Log(JSON.stringify(obj));
    }
}
