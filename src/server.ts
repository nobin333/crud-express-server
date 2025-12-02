import express, { Request, Response } from "express"
import { Pool } from "pg"
import dotenv from "dotenv"
import path from "path"
const app = express()
const port = 5000

dotenv.config({ path: path.join(process.cwd(), ".env") });
// Database
const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING,
})



const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY ,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);

    await pool.query(`
            CREATE TABLE IF NOT EXISTS todos(
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT false,
            due_date DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
}
initDB()

// logger middleware
const logger = (req: Request, res: Response, next: Function) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}\n`);
  next();
};

// Parser
app.use(express.json())
// app.use(express.urlencoded())

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

//users CRUD post
app.post("/users", async (req: Request, res: Response) => {
    const { name, email } = req.body
    try {
        const result = await pool.query(
            `INSERT INTO users(name, email) VALUES($1, $2) RETURNING *`, [name, email]
        )
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
})

// users Crud get
app.get("/users", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM users`);

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.rows,
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            datails: err,
        });
    }
});

app.get("/users/:id", async (req: Request, res: Response) => {
    // console.log(req.params.id);
    try {
        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.params.id,]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        } else {
            res.status(200).json({
                success: true,
                message: "User fetched successfully",
                data: result.rows[0],
            });
        }
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

//users crud update
app.put("/users/:id", async (req: Request, res: Response) => {
    // console.log(req.params.id);
    const { name, email } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`,
            [name, email, req.params.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        } else {
            res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: result.rows[0],
            });
        }
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

//users crud delete
app.delete("/users/:id", async (req: Request, res: Response) => {
    // console.log(req.params.id);
    try {
        const result = await pool.query(`DELETE FROM users WHERE id = $1`, [
            req.params.id,
        ]);

        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        } else {
            res.status(200).json({
                success: true,
                message: "User deleted successfully",
                data: result.rows,
            });
        }
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// todos crud create
app.post("/todos", async (req: Request, res: Response) => {
    const { user_id, title } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO todos(user_id, title) VALUES($1, $2) RETURNING *`,
            [user_id, title]
        );
        res.status(201).json({
            success: true,
            message: "Todo created",
            data: result.rows[0],
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

//todos crud get
app.get("/todos", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM todos`);

        res.status(200).json({
            success: true,
            message: "todos retrieved successfully",
            data: result.rows,
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            datails: err,
        });
    }
});

// todos crud get single
app.get("/todos/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM todos WHERE id = $1", [
            req.params.id,
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch todo" });
    }
});

// todos crud update
app.put("/todos/:id", async (req, res) => {
    const { title, completed } = req.body;

    try {
        const result = await pool.query(
            "UPDATE todos SET title=$1, completed=$2 WHERE id=$3 RETURNING *",
            [title, completed, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to update todo" });
    }
});

// todos crud delete
app.delete("/todos/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM todos WHERE id=$1 RETURNING *",
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }

        res.json({ success: true, message: "Todo deleted", data: null });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to delete todo" });
    }
});

//route not found api
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path,
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
