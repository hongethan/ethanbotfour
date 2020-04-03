// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

class DispatchBot extends ActivityHandler {
    constructor() {
        super();

        // If the includeApiResults parameter is set to true, as shown below, the full response
        // from the LUIS api will be made available in the properties  of the RecognizerResult
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: '232471b4-d9d7-440f-ba4b-c486da24ecbb',
            endpointKey: '024525c05fc441ec9d6d1f460e5af43c',
            endpoint: 'https://lingethan.cognitiveservices.azure.com/'
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        this.dispatchRecognizer = dispatchRecognizer;

        this.onMessage(async (context, next) => {
            await context.sendActivity('Processing Message Activity.');

            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            const recognizerResult = await dispatchRecognizer.recognize(context);
            await context.sendActivity('call dispatcher');
            const intent = LuisRecognizer.topIntent(recognizerResult);
            await context.sendActivity('call topIntent');
            await context.sendActivity(intent);
            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            // Top intent tell us which cognitive service to use.
            //const intent = LuisRecognizer.topIntent(recognizerResult);

            // Next, we call the dispatcher with the top intent.
            //await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Type a greeting or a question about the weather to get started.';
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
                await context.sendActivity(member.id);
                await context.sendActivity(member.name);
                await context.sendActivity(context.activity.recipient.id);
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to Dispatch bot ${member.name}. ${welcomeText}`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async dispatchToTopIntentAsync(context, intent, recognizerResult) {
        switch (intent) {
            case 'VendorSearch':
                await context.sendActivity('enter dispathere vendor search');
                await this.processVendor(context, recognizerResult);
                break;
            case 'None':
                await this.processNone(context, recognizerResult.luisResult);
                break;
            default:
                console.log(`Dispatch unrecognized intent: ${intent}.`);
                await context.sendActivity(`Dispatch unrecognized intent: ${intent}.`);
                break;
        }
    }

    async processVendor(context, recognizerResult) {
        console.log('processVendor');

        const luisResult = recognizerResult.luisResult;

        // Retrieve LUIS result for Process Automation.
        const result = luisResult.connectedServiceResult;
        const intent = result.topScoringIntent.intent;

        await context.sendActivity(`processVendor top intent ${intent}.`);
        await context.sendActivity(`processVendor intents detected:  ${luisResult.intents.map((intentObj) => intentObj.intent).join('\n\n')}.`);

        if (luisResult.entities.length > 0) {
            await context.sendActivity(`processVendor entities were found in the message: ${luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n')}.`);
        }
    }

    async processNone(context, luisResult) {
        console.log('processNone');

        // Retrieve LUIS results for Weather.
        const result = luisResult.connectedServiceResult;
        const topIntent = result.topScoringIntent.intent;

        await context.sendActivity(`processNone top intent ${topIntent}.`);
        await context.sendActivity(`processNone intents detected:  ${luisResult.intents.map((intentObj) => intentObj.intent).join('\n\n')}.`);

        if (luisResult.entities.length > 0) {
            await context.sendActivity(`processNone entities were found in the message: ${luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n')}.`);
        }
    }
}

module.exports.DispatchBot = DispatchBot;
