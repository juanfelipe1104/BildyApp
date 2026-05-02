import type { Request, Response } from "express";
import { Types } from "mongoose";
import Client from "../models/Client.js";
import Project from "../models/Project.js";
import DeliveryNote from "../models/DeliveryNote.js";

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
    const companyId = new Types.ObjectId(req.user.company!.toString());

    const [
        totalClients,
        totalProjects,
        totalDeliveryNotes,
        signedStats,
        deliveryNotesByMonth,
        hoursByProject,
        materialsByClient,
        projectsByStatus
    ] = await Promise.all([
        Client.countDocuments({
            company: companyId,
            deleted: false
        }),

        Project.countDocuments({
            company: companyId,
            deleted: false
        }),

        DeliveryNote.countDocuments({
            company: companyId,
            deleted: false
        }),

        DeliveryNote.aggregate([{
            $match: {
                company: companyId,
                deleted: false
            }
        },
        {
            $group: {
                _id: "$signed",
                total: { $sum: 1 }
            }
        }
        ]),

        DeliveryNote.aggregate([{
            $match: {
                company: companyId,
                deleted: false
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$workDate" },
                    month: { $month: "$workDate" }
                },
                total: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                month: {
                    $concat: [
                        { $toString: "$_id.year" },
                        "-",
                        {
                            $cond: [
                                { $lt: ["$_id.month", 10] },
                                { $concat: ["0", { $toString: "$_id.month" }] },
                                { $toString: "$_id.month" }
                            ]
                        }
                    ]
                },
                total: 1
            }
        },
        {
            $sort: {
                month: 1
            }
        }
        ]),

        DeliveryNote.aggregate([{
            $match: {
                company: companyId,
                deleted: false,
                format: "hours"
            }
        },
        {
            $addFields: {
                computedHours: {
                    $cond: [
                        { $gt: [{ $ifNull: ["$hours", 0] }, 0] },
                        "$hours",
                        {
                            $sum: {
                                $map: {
                                    input: { $ifNull: ["$workers", []] },
                                    as: "worker",
                                    in: "$$worker.hours"
                                }
                            }
                        }
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$project",
                totalHours: { $sum: "$computedHours" }
            }
        },
        {
            $lookup: {
                from: "projects",
                localField: "_id",
                foreignField: "_id",
                as: "project"
            }
        },
        {
            $unwind: "$project"
        },
        {
            $project: {
                _id: 0,
                projectId: "$project._id",
                project: "$project.name",
                totalHours: 1
            }
        },
        {
            $sort: {
                totalHours: -1
            }
        }
        ]),

        DeliveryNote.aggregate([{
            $match: {
                company: companyId,
                deleted: false,
                format: "material"
            }
        },
        {
            $group: {
                _id: {
                    client: "$client",
                    material: "$material",
                    unit: "$unit"
                },
                totalQuantity: { $sum: "$quantity" }
            }
        },
        {
            $lookup: {
                from: "clients",
                localField: "_id.client",
                foreignField: "_id",
                as: "client"
            }
        },
        {
            $unwind: "$client"
        },
        {
            $project: {
                _id: 0,
                clientId: "$client._id",
                client: "$client.name",
                material: "$_id.material",
                unit: "$_id.unit",
                totalQuantity: 1
            }
        },
        {
            $sort: {
                client: 1,
                material: 1
            }
        }
        ]),

        Project.aggregate([{
            $match: {
                company: companyId,
                deleted: false
            }
        },
        {
            $group: {
                _id: "$active",
                total: { $sum: 1 }
            }
        }
        ])
    ]);

    const signedDeliveryNotes = signedStats.find(item => item._id === true)?.total ?? 0;

    const pendingDeliveryNotes = signedStats.find(item => item._id === false)?.total ?? 0;

    const activeProjects = projectsByStatus.find(item => item._id === true)?.total ?? 0;

    const inactiveProjects = projectsByStatus.find(item => item._id === false)?.total ?? 0;

    res.status(200).json({
        summary: {
            clients: totalClients,
            projects: totalProjects,
            deliveryNotes: totalDeliveryNotes,
            signedDeliveryNotes,
            pendingDeliveryNotes
        },
        deliveryNotesByMonth,
        hoursByProject,
        materialsByClient,
        projectsByStatus: {
            active: activeProjects,
            inactive: inactiveProjects
        }
    });
};