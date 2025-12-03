import { Request, Response } from "express"
import { pool } from "../../config/db"
import { userService } from "./user.service"

const createUser = async (req: Request, res: Response) => {
    const { name, email } = req.body
    try {
        const result = await userService.createUser(name, email)
        res.status(201).json({
            success: true,
            message: "Data Instered Successfully",
            data: result.rows[0],
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const userControllers = {
    createUser
}