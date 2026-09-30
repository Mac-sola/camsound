import Song, { ISong } from '../models/Song';

/**
 * SongRepository
 * 
 * Responsibility: Direct database operations (CRUD & queries) for the Song model.
 * Encapsulates Mongoose query building and population away from the business layer.
 */
export class SongRepository {
    private readonly artistPopulationFields = 'name image genre instagramUrl twitterUrl facebookUrl youtubeUrl';

    /**
     * Find a paginated list of songs matching the provided filter and sort criteria.
     */
    async findSongs(filter: any, sortOption: any, skip: number, limit: number): Promise<ISong[]> {
        return Song.find(filter)
            .populate('artistId', this.artistPopulationFields)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
    }

    /**
     * Count the total number of songs matching the given filter (used for pagination metadata).
     */
    async countSongs(filter: any): Promise<number> {
        return Song.countDocuments(filter);
    }

    /**
     * Find a single song by its MongoDB ID with artist details populated.
     */
    async findById(id: string): Promise<ISong | null> {
        return Song.findById(id).populate('artistId', this.artistPopulationFields);
    }

    /**
     * Find a single song by ID with only basic artist details (useful for ownership validation).
     */
    async findByIdRaw(id: string): Promise<ISong | null> {
        return Song.findById(id).populate('artistId');
    }

    /**
     * Create and save a new song in MongoDB.
     */
    async create(songData: Partial<ISong>): Promise<ISong> {
        return Song.create(songData);
    }

    /**
     * Update an existing song's details.
     */
    async update(id: string, updateData: Partial<ISong>): Promise<ISong | null> {
        return Song.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    /**
     * Delete a song from MongoDB by its ID.
     */
    async delete(id: string): Promise<ISong | null> {
        return Song.findByIdAndDelete(id);
    }

    /**
     * Atomically increment the play counter for a song.
     */
    async incrementPlays(id: string): Promise<ISong | null> {
        return Song.findByIdAndUpdate(id, { $inc: { plays: 1 } }, { new: true });
    }
}

export default new SongRepository();
