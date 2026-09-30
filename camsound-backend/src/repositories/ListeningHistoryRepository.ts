import ListeningHistory, { IListeningHistory } from '../models/ListeningHistory';

/**
 * ListeningHistoryRepository
 * 
 * Responsibility: Direct database operations for logging user streaming history.
 */
export class ListeningHistoryRepository {
    /**
     * Log a play event into the listening history collection.
     */
    async logPlay(userId: string, songId: string): Promise<IListeningHistory> {
        return ListeningHistory.create({ userId, songId, playedAt: new Date() });
    }
}

export default new ListeningHistoryRepository();
