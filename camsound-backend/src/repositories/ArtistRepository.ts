import Artist, { IArtist } from '../models/Artist';

/**
 * ArtistRepository
 * 
 * Responsibility: Direct database operations (CRUD) for the Artist model.
 * Separates data persistence from controller/HTTP layers.
 */
export class ArtistRepository {
    /**
     * Create an artist profile for an authenticated user.
     */
    async createProfile(data: Partial<IArtist>): Promise<IArtist> {
        return Artist.create(data);
    }

    /**
     * Find an artist profile associated with a user ID.
     */
    async findByUserId(userId: string): Promise<IArtist | null> {
        return Artist.findOne({ userId });
    }

    /**
     * Find an artist by their unique Artist ID.
     */
    async findById(artistId: string): Promise<IArtist | null> {
        return Artist.findById(artistId);
    }

    /**
     * Update an artist profile.
     */
    async updateProfile(artistId: string, updateData: Partial<IArtist>): Promise<IArtist | null> {
        return Artist.findByIdAndUpdate(artistId, updateData, { new: true, runValidators: true });
    }

    /**
     * Increment or decrement the songsCount for an artist.
     */
    async incrementSongsCount(artistId: string, amount: number): Promise<void> {
        await Artist.findByIdAndUpdate(artistId, { $inc: { songsCount: amount } });
    }
}

export default new ArtistRepository();
