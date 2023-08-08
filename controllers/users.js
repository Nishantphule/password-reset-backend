const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
require("dotenv").config();
const rs = require('random-strings');

usersRouter.get("/", async (req, res) => {
    const users = await User.find({}, {})
    res.status(200).json({ users });
})

usersRouter.delete("/deleteAll", async (req, res) => {
    await User.deleteMany({})
    res.status(200).json({ message: "Users Deleted Succesfully" });
})

usersRouter.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
        username,
        email,
        password: hashedPassword
    })

    const savedUser = await user.save()
    res.status(201).json({ message: 'User registered successfully', user: savedUser });

})

usersRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username })

    const checkPass = await bcrypt.compare(password, user.password)

    if (user && checkPass) {
        res.status(201).json({ message: 'Login successfully', user });
    }
    else {
        res.status(504).json({ message: 'Invalid credentials' });
    }
})

usersRouter.post("/resetpassword", async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email: email })

    if (user) {

        const resetToken = await rs.alphaNumMixed(20);
        const resetLink = `https://password-reset-node-app.onrender.com/users/resetpassword/?resetToken=${resetToken}`

        const EMAIL_PASS = process.env.EMAIL_PASS;

        const transporter = await nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'nishantphule12@gmail.com',
                pass: EMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'nishantphule12@gmail.com', // sender address
            to: email, // list of receivers
            text: ` Click the link to reset password ${resetLink}`,
            html: ` Click the link to reset password <a href=${resetLink}>Click here</a></h2>`
        };

        await transporter.sendMail(mailOptions, function (err, info) {
            if (err)
                console.log(err)
            else
                console.log(info);
        });

        user.resetToken = resetToken;
        await user.save()
        res.status(201).json({ message: 'Check your email' });
    }
    else {
        res.status(504).json({ message: 'Invalid Email' });
    }
})


usersRouter.get('/resetpassword', async (req, res) => {

    const resetToken = req.query.resetToken;

    const user = await User.findOne({ resetToken: resetToken });

    const id = user._id;

    if (user) {
        res.redirect(`https://password-reset-react-app.netlify.app/updatepassword/${id}`)
    }
    else {
        res.status(504).json({ message: "Invalid Token" })
    }

})


usersRouter.put('/updatepassword/:id', async (req, res) => {

    const data = req.body;
    const { id } = req.params;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const update = {
        password: hashedPassword,
        updatedAt: Date.now,
        resetToken: ""
    }

    User.findByIdAndUpdate(id, update)
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(201).json(updatedUser);
        })
        .catch((error) => {
            res.status(500).json({ error: 'Internal server error' });
        });

})


module.exports = usersRouter;