declare module 'render'
{
    import { Readable } from 'stream';

    export function getFilename(streamedResponse:object):string;
    export function render(template:string, data:object, options:[string, object], callback: () => void):Readable;

}

declare module 'templates'
{
    import { Readable } from 'stream';

    export function addTemplate(template:string, payload:string, callback: () => void, _retry:boolean):string;
    export function delTemplate(templateId:string, callback: () => void, _retry:boolean):string;
    export function getTemplate(templateId:string, callback: () => void):Readable;

}

declare module 'promise'
{
    import { Readable } from 'stream';

    export function addTemplatePromise(localPath:string, payload:string):string;
    export function delTemplatePromise(templateId:string):string;
    export function getTemplatePromise(templateId:string):Readable;
    export function renderPromise(pathOrId:string, data:object, options:[string, object], callback: () => void):[content:Readable, filename:string];

}