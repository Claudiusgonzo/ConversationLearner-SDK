import * as fs from 'fs'
import { Template, ActionPayload, TemplateVariable } from 'blis-models'
import { BlisMemory } from './BlisMemory';
import { BlisDebug } from './BlisDebug';

//TODO - make this configurable
const templateDirectory = __dirname + "../../../../cards/";

export class TemplateProvider { 
        private static hasSumbitItem = false;

        public static async RenderTemplate(actionPayload: ActionPayload, memory: BlisMemory) : Promise<any> {

            let templateName = actionPayload.payload;

            let template = this.GetTemplate(templateName);
            let templateString = JSON.stringify(template);
            let argumentNames = this.GetArgumentNames(templateString);

            // Substitute argument values
            for (let argumentName of argumentNames) {
                let actionArgument = actionPayload.arguments.find(a => a.parameter == argumentName);
                if (actionArgument) {
                    // Substitue any entities
                    let value = await memory.BotMemory.SubstituteEntities(actionArgument.value);
                    templateString = templateString.replace(new RegExp(`{{${argumentName}}}`, 'g'), value);
                }
            }
            return JSON.parse(templateString);
        }

        public static GetTemplates() : Template[] {
            let templates : Template[] = [];
            let files = this.GetTemplatesNames();
            for (let file of files) {
                let fileContent = this.GetTemplate(file);
                
                // Clear submit check (will the set by extracting template variables)
                this.hasSumbitItem = false;
                let tvs = this.UniqueTemplateVariables(fileContent);

                // Make sure template has submit item
                let validationError = this.hasSumbitItem ? null :
                    `Template "${file}" does not have an action with a "submit" item in the data.  At least on action item must be of the form: "type": "Action.Submit", "data": { "submit": "{SUBMIT PAYLOAD"}`;

                let templateBody = JSON.stringify(this.GetTemplate(file));
                let template = new Template(
                    {
                        name : file,
                        variables: tvs,
                        body: templateBody,
                        validationError: validationError
                    }
                )
                templates.push(template);
            }

            return templates;
        }

        
        private static UniqueTemplateVariables(template: any) : TemplateVariable[] {

            // Get all template variables
            let templateVariables = this.GetTemplateVariables(template)

            // Make entries unique, and use verion with existing type
            let unique = [];
            for (let tv of templateVariables) {
                let existing = unique.find(i => i.key == tv.key);
                if (existing) 
                {
                    if (existing.type != null && tv.type != null && existing.type != tv.type) {
                        BlisDebug.Error(`Template variable "${tv.key}" used for two diffent types - "${tv.type}" and "${existing.type}".  Ignoring.`);
                    }
                    else {
                        existing.type = existing.type || tv.type;
                    }
                }
                else {
                    unique.push(tv);
                }
            }
            return unique;
        }

        public static GetArgumentNames(formString : string) {

            // Get set of unique entities
            let mustaches = formString.match(/{{\s*[\w\.]+\s*}}/g);
            if (mustaches) {
                let entities = [...new Set(mustaches.map(x => x.match(/[\w\.]+/)[0]))];
                return entities;
            }
            return [];
        }

        public static GetTemplate(templateName: string) : any {
            return require(`${templateDirectory}${templateName}.json`);
        }

        public static GetTemplatesNames() : string[] {
            let fileNames : string[] = fs.readdirSync(templateDirectory);
            fileNames = fileNames.filter(fn => fn.endsWith(".json"));
            let templates = fileNames.map(f => f.slice(0, f.indexOf('.')));
            return templates;
        }

        private static GetVarNames(template: any) : string[] {
            let mustaches : string[] = [];
            for (let i in template) {
                if (typeof template[i] != 'object') {
                    let searchStr = JSON.stringify(template[i]);
                    let results = searchStr.match(/{{\s*[\w\.]+\s*}}/g); 
                    if (results) {
                        mustaches = mustaches.concat(results.map(x => x.match(/[\w\.]+/)[0]));
                    }
                }
            }
            return mustaches;
        }

        private static GetTemplateVariables(template: any) : TemplateVariable[] {
            var tvs : TemplateVariable[] = [];
            if (template.data && template.data.submit) {
                this.hasSumbitItem = true;
            }

            // Get variable names 
            let vars = this.GetVarNames(template);
            if (vars.length > 0) {
                for (let key of vars) {
                    let tv = new TemplateVariable({key: key, type: template['type']});
                    tvs.push(tv);
                }
            }

            // Itterate through keys
            for (let i in template) {
                if (!template.hasOwnProperty(i)) {
                    continue;
                }
                if (template[i] instanceof Array) {
                    for (let item of template[i]) {
                        tvs = tvs.concat(this.GetTemplateVariables(item));
                    }
                }
                else if (typeof template[i] == 'object') {
                    tvs = tvs.concat(this.GetTemplateVariables(template[i]));    
                }
            }

            return tvs;
        }
    }