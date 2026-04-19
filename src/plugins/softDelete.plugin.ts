import type { HydratedDocument, Model, Query, Schema, Types } from 'mongoose';

export interface SoftDeleteFields {
    deleted: boolean;
    deletedAt: Date | null;
    deletedBy: string | null;
}

export interface SoftDeleteMethods {
    softDelete(deletedBy?: string | null): Promise<HydratedDocument<any>>;
    restore(): Promise<HydratedDocument<any>>;
}

export interface SoftDeleteStatics {
    softDeleteById(id: Types.ObjectId | string, deletedBy?: string | null): Query<any, any>;
    restoreById(id: Types.ObjectId | string): Query<any, any>;
    findWithDeleted(filter?: Record<string, unknown>): Query<any, any>;
    findDeleted(filter?: Record<string, unknown>): Query<any, any>;
    hardDelete(id: Types.ObjectId | string): Query<any, any>;
}

type SoftDeleteModel = Model<any, any, SoftDeleteMethods> & SoftDeleteStatics;

type QueryWithDeletedOption = Query<any, any> & {
    getOptions(): { withDeleted?: boolean };
};

const softDeletePlugin = (schema: Schema<any, SoftDeleteModel, SoftDeleteMethods>): void => {
    schema.add({
        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: String,
            default: null
        }
    });

    const excludeDeleted = function (this: QueryWithDeletedOption): void {
        if (!this.getOptions().withDeleted) {
            this.where({
                deleted: { $ne: true }
            });
        }
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    schema.methods.softDelete = async function (this: HydratedDocument<any>, deletedBy: string | null = null) {
        this.deleted = true;
        this.deletedAt = new Date();
        this.deletedBy = deletedBy;
        return this.save();
    };

    schema.methods.restore = async function (this: HydratedDocument<any>) {
        this.deleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        return this.save();
    };

    schema.statics.softDeleteById = async function (this: SoftDeleteModel, id: Types.ObjectId | string, deletedBy: string | null = null) {
        return this.findByIdAndUpdate(
            id,
            {
                deleted: true,
                deletedAt: new Date(),
                deletedBy
            },
            { new: true }
        ).setOptions({ withDeleted: true });
    };

    schema.statics.restoreById = async function (this: SoftDeleteModel, id: Types.ObjectId | string) {
        return this.findByIdAndUpdate(
            id,
            {
                deleted: false,
                deletedAt: null,
                deletedBy: null
            },
            { new: true }
        ).setOptions({ withDeleted: true });
    };

    schema.statics.findWithDeleted = function (this: SoftDeleteModel, filter: Record<string, unknown> = {}) {
        return this.find(filter).setOptions({ withDeleted: true });
    };

    schema.statics.findDeleted = function (this: SoftDeleteModel, filter: Record<string, unknown> = {}) {
        return this.find({ ...filter, deleted: true }).setOptions({
            withDeleted: true
        });
    };

    schema.statics.hardDelete = function (this: SoftDeleteModel, id: Types.ObjectId | string) {
        return this.findByIdAndDelete(id).setOptions({ withDeleted: true });
    };
};

export default softDeletePlugin;