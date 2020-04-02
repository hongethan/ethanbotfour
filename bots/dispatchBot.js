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
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: 'https://${ process.env.LuisAPIHostName }'
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        this.dispatchRecognizer = dispatchRecognizer;

        this.onMessage(async (context, next) => {
            await context.sendActivity('Processing Message Activity.');
            await context.sendActivity(process.env.LuisAppId);
            await context.sendActivity(process.env.LuisAPIKey);
            await context.sendActivity(process.env.LuisAPIHostName);

            await context.sendActivity(dispatchRecognizer);
            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            const recognizerResult = await dispatchRecognizer.recognize(context);
            await context.sendActivity(recognizerResult);

            // Top intent tell us which cognitive service to use.
            const intent = LuisRecognizer.topIntent(recognizerResult);
            await context.sendActivity(intent);


            // Next, we call the dispatcher with the top intent.
            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Type a greeting or a question about the weather to get started.';
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
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
            case 'SNXVendorSearch':
                await this.processVendor(context, recognizerResult.luisResult);
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

    async processVendor(context, luisResult) {
        console.log('processVendor');

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
