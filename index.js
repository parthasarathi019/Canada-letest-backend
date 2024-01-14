const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware for JWT verification
const verifyJWT = (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (!token) {
            throw new Error("unauthorized user");
        }
        token = token.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            throw new Error("unauthorized user");
        }
        req.decoded = decoded;
        next();
    } catch (error) {
        res.status(401).send({ error: error.message });
    }
};

// MongoDB connection setup
// const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.by31wed.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.by31wed.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

const run = async () => {
    try {
        // Collections setup
        const Users = client.db("User_Info_Management_Client_USA").collection("users");
        const User_Data = client.db("User_Info_Management_Client_USA").collection("User_Data"); //database collection 5
        const Date = client.db("User_Info_Management_Client_USA").collection("Date"); //database collection 5



        // Middleware for verifying admin role
        const verifyAdmin = async (req, res, next) => {
            try {
                const email = req.decoded.email;
                const user = await Users.findOne({ email });
                if (user.role !== "admin") {
                    return res.send({ isAdmin: false });
                }
                next();
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        };

        // Middleware for verifying instructor role
        const verifyInstructor = async (req, res, next) => {
            try {
                const email = req.decoded.email;
                const user = await Users.findOne({ email });
                if (user.role !== "instructor") {
                    return res.send({ isInstructor: false });
                }
                next();
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        };

        // Generate JWT web token
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
                expiresIn: "2d",
            });
            res.send({ token: `Bearer ${token}` });
        });

        // Get all users
        app.get("/api/users", verifyJWT, verifyAdmin, async (req, res) => {
            try {
                const email = req.decoded.email;
                const users = await Users.find({ email: { $not: { $eq: email } } }).toArray();
                res.send(users);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Create a user
        app.post("/api/users", async (req, res) => {
            try {
                const existingUser = await Users.findOne({ email: req.body.email });
                if (existingUser) {
                    res.send(existingUser);
                    return;
                }
                const result = await Users.insertOne(req.body);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Make a user admin or instructor
        app.patch("/api/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
            try {
                const _id = new ObjectId(req.params.id);
                const { role } = req.body;
                const result = await Users.updateOne({ _id }, { $set: { role } });
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Send role status
        app.get("/api/users/:email", verifyJWT, async (req, res) => {
            try {
                const { email } = req.decoded;
                if (email !== req.params.email) {
                    return res.status(403).send({ error: "bad auth" });
                }
                const user = await Users.findOne({ email });
                const role = user.role || "student";
                res.send({ role });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // get slider contents


        app.post('/cofees', async (req, res) => {  //>>>>==== send data to database>>>>>>>>
            const cofee = req.body;
            console.log(cofee);
            const result = await User_Data.insertOne(cofee);
            res.send(result)
        })


        app.delete('/delete_User/:id', async (req, res) => {  //xxxx==== delete data from database xxxxxxx
            const id = req.params.id
            console.log("deleting id", id);
            const query = { _id: new ObjectId(id) };                                                             //𝐃𝐄𝐋𝐄𝐓𝐄
            const Drone = await User_Data.deleteOne(query);
            res.send(Drone)
        })



        app.get('/Datas', async (req, res) => {   //<<<==== get data from database<<<<<<<<<<
            // https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/
            const cursor = User_Data.find();
            const result = await cursor.toArray()                                               //𝐆𝐄𝐓
            res.send(result)
        })
        app.get('/Users_Infos', async (req, res) => {   //<<<==== get data from database<<<<<<<<<<
            // https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/
            const cursor = Users.find();
            const result = await cursor.toArray()                                               //𝐆𝐄𝐓
            res.send(result)
        })


        app.delete('/delete_User_Data/:id', async (req, res) => {  //xxxx==== delete data from database xxxxxxx
            const id = req.params.id
            console.log("deleting id", id);
            const query = { _id: new ObjectId(id) };                                                             //𝐃𝐄𝐋𝐄𝐓𝐄
            const Drone = await Users.deleteOne(query);
            res.send(Drone)
        })
        app.patch('/user_data/admin/:id', async (req, res) => {
            const id = req.params.id
            // const update_booking = req.body;
            // //https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/
            const filter = { _id: new ObjectId(id) };                                             //PATCH ~ 𝐔𝐏𝐃𝐀𝐓𝐄_All
            // const options = { upsert: true };
            const update_user_data = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await Users.updateOne(filter, update_user_data);
            res.send(result)
            // console.log('clear', update_user);
        })


        app.patch('/user_data/instructor/:id', async (req, res) => {
            const id = req.params.id
            // const update_booking = req.body;
            // //https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/
            const filter = { _id: new ObjectId(id) };                                             //PATCH ~ 𝐔𝐏𝐃𝐀𝐓𝐄_All
            // const options = { upsert: true };
            const update_user_data = {
                $set: {
                    role: 'instructor'
                },
            };

            const result = await Users.updateOne(filter, update_user_data);
            res.send(result)
            // console.log('clear', update_user);
        })

        app.patch('/user_data/User_Hide/:id', async (req, res) => {
            const id = req.params.id
            // const update_booking = req.body;
            // //https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/
            const filter = { _id: new ObjectId(id) };                                             //PATCH ~ 𝐔𝐏𝐃𝐀𝐓𝐄_All
            // const options = { upsert: true };
            const update_user_data = {
                $set: {
                    User_Hide: 'yes'
                },
            };

            const result = await User_Data.updateOne(filter, update_user_data);
            res.send(result)
            // console.log('clear', update_user);
        })
        app.patch('/user_data/User_UnHide/:id', async (req, res) => {
            const id = req.params.id
            // const update_booking = req.body;
            // //https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/
            const filter = { _id: new ObjectId(id) };                                             //PATCH ~ 𝐔𝐏𝐃𝐀𝐓𝐄_All
            // const options = { upsert: true };
            const update_user_data = {
                $set: {
                    User_Hide: 'No'
                },
            };

            const result = await User_Data.updateOne(filter, update_user_data);
            res.send(result)
            // console.log('clear', update_user);
        })
        app.patch('/user_data/Approved_or_Deny/:id', async (req, res) => {
            const id = req.params.id
            // const update_booking = req.body;
            // //https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/
            const filter = { _id: new ObjectId(id) };                                             //PATCH ~ 𝐔𝐏𝐃𝐀𝐓𝐄_All
            // const options = { upsert: true };
            const update_user_data = {
                $set: {
                    Status: 'Approved'
                },
            };

            const result = await User_Data.updateOne(filter, update_user_data);
            res.send(result)
            // console.log('clear', update_user);
        })

        app.get('/dates', async (req, res) => {   //<<<==== get data from database<<<<<<<<<<
            // https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/
            const cursor = Date.find();
            const result = await cursor.toArray()                                               //𝐆𝐄𝐓
            res.send(result)
        })


        //|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
        app.get('/User_Data', async (req, res) => {   //<<<==== get data from database<<<<<<<<<<
            // https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/
            const cursor = User_Data.find();
            const result = await cursor.toArray()                                               //𝐆𝐄𝐓
            res.send(result)
        })

        // app.get('/User_Data/:id', async (req, res) => {
        //     const id = req.params.id
        //     const query = { _id: new ObjectId(id) };
        //     const result = await User_Data.findOne(query);
        //     res.send(result)

        // })


        app.get('/User_Data/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const query = { _id: new ObjectId(id) }
                // const query = { _id: id }; 
                const result = await User_Data.findOne(query);

                if (!result) {
                    console.error('User not found for ID:', id);
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json(result);
            } catch (error) {
                console.error('Error retrieving user data:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.put('/User_Data/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const query = { _id: new ObjectId(id) } // Assuming _id is a string in your data
                const updatedData = req.body;

                // Update the user data in the MongoDB collection
                const result = await User_Data.updateOne(query, { $set: updatedData });

                if (!result) {
                    console.error('User not found for ID:', id);
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json(result);
            } catch (error) {
                console.error('Error retrieving user data:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        // app.put('/User_Data/:id', async (req, res) => {
        //     try {
        //         const id = req.params.id;

        //         const query = { _id: new ObjectId(id) };
        //         const updatedData = req.body;

        //         // Update the user data in the MongoDB collection
        //         const result = await User_Data.updateOne(query, { $set: updatedData });

        //         if (result.modifiedCount === 0) {
        //             return res.status(404).json({ error: 'User not found' });
        //         }

        //         res.json({ message: 'User data updated successfully', updatedUser: updatedData });
        //     } catch (error) {
        //         console.error('Error updating user data:', error);
        //         res.status(500).json({ error: 'Internal Server Error' });
        //     }
        // });




        app.get('/result/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const user = await User_Data.findOne({ id });
                if (user) {
                    res.json(user);
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        app.get('/ircc/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const user = await User_Data.findOne({ IRCC_Num: id });
                if (user) {
                    res.json(user);
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.patch("/change-date/:id", async (req, res) => {
            const { dateValue } = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    date: dateValue,
                },
            };
            const result = await Date.updateOne(filter, update);
            res.send(result);
        });


        //||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.log(error);
    }
};

run();

// Home route
app.get("/", (req, res) => {
    res.send("<h1>Welcome to LensCraft Server</h1>");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
