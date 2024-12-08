import { parentPort } from 'worker_threads';
import { DraftPostService } from '../services/draftPostService';

const draftPostService = new DraftPostService();

parentPort?.on('message', async (draftId) => {
  try {
    await draftPostService.postDraft(draftId);
    parentPort?.postMessage({ success: true, draftId });
  } catch (error) {
    parentPort?.postMessage({ success: false, error, draftId });
  }
}); 