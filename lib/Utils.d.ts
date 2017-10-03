import * as builder from 'botbuilder';
import { BlisContext } from './BlisContext';
import { BlisMemory } from './BlisMemory';
export declare class Utils {
    static SendTyping(bot: builder.UniversalBot, address: any): void;
    /** Send a text message */
    static SendMessage(bot: builder.UniversalBot, memory: BlisMemory, content: string | builder.Message): Promise<void>;
    static SendAsAttachment(context: BlisContext, content: string): void;
    /** Handle that catch clauses can be any type */
    static ErrorString(error: any): string;
    static ReadFromFile(url: string): Promise<string>;
}
