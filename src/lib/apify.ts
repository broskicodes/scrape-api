import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export async function runApifyActor(actorId: string, input: any) {
    const run = await apifyClient.actor(actorId).call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    return items;
}
