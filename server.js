const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const port = 3019

const app = express();
app.use(express.urlencoded({extended:true}))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Configure views directory

app.use(express.static(path.join(__dirname, 'public')));

//mongoose.connect('mongodb://127.0.0.1:27017/testfyp')
mongoose.connect('mongodb+srv://22026341:fyp1@cluster0.rtrnk.mongodb.net/testfyp')
const db = mongoose.connection
db.once('open',()=>{
    console.log("MongoDB connection successful")
})

// const userSchema = new mongoose.Schema({
//     name:String,
//     email:String,
//     phone:String,
//     appointment_date:String,
//     appointment_time:String,
//     notes:String
// })

const appointmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "10:00 AM"
    maxPatients: { type: Number, default: 5 }, // Maximum patients for this slot
    currentPatients: { type: Number, default: 0 }, // Current number of booked patients
});

// Create Model
const Appointment = mongoose.model("Appointment", appointmentSchema);

// Define Employee Schema
const employeeSchema = new mongoose.Schema({
    employee_id: String,
    name: String,
    email: String,
    phone: String,
    company: String,
    package: String,
});

// Define Patient Appointment Booking Schema
const PatientAppointmentBookingSchema = new mongoose.Schema({
    employee_id: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    specialRequests: { type: String }, // Optional field
});

const PatientAppointmentBooking = mongoose.model('EmployeeAppointmentBooking', PatientAppointmentBookingSchema);

//const users = mongoose.model("data",userSchema)

const Employee = mongoose.model("Employee", employeeSchema);
console.log(Employee)

// app.get("/",(req,res)=>{
//     res.sendFile(path.join(__dirname,'form.html'))
// })
app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,'employeeForm.html'))
})

// Route to check employee ID and display details if found
app.post('/check-employee', async (req, res) => {
    const { employee_id } = req.body;

    try {
        // Search for employee by ID
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            // Render the EJS template and pass employee data
            res.render('employeeDetails', { employee });
        } else {
            res.send("<h1>Employee ID not found. Please try again.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// Route to serve the update form
app.get('/update-employee/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        // Find employee by ID
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            // Render the updateemployeeDetails EJS template and pass employee data
            res.render('updateemployeeDetails', { employee });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// Route to handle employee update
app.post('/update-employee/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    const { name, email, phone } = req.body; // Only update name, email, and phone

    try {
        // Update employee details in the database
        const updatedEmployee = await Employee.findOneAndUpdate(
            { employee_id },
            { name, email, phone }, // Only update allowed fields
            { new: true } // Return the updated document
        );

        if (updatedEmployee) {
            res.send(`
                <h1>Employee details updated successfully!</h1>
                <a href="/check-employee-profile/${updatedEmployee.employee_id}">Back to Profile Page</a>
            `);
        } else {
            res.send("<h1>Employee ID not found. No updates made.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// Route to view employee profile by ID
app.get('/check-employee-profile/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        // Search for employee by ID
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            // Render the EJS template and pass employee data
            res.render('employeeDetails', { employee });
        } else {
            res.send("<h1>Employee ID not found. Please try again.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// Serve booking form
app.get('/booking-form', (req, res) => {
    res.render('bookingForm');
});

// Booking form with pre-filled employee ID
app.get('/booking-form/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    //console.log("Received employee_id for booking form:", employee_id);  // Debugging line

    try {
        const employee = await Employee.findOne({ employee_id });
        if (employee) {
            res.render('bookingForm', { employeeID: employee.employee_id });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Server error");
    }
});

// Handle appointment booking submission
app.post('/book-appointment', async (req, res) => {
    const { employee_id, date, time, reason, specialRequests } = req.body; 
    console.log("Booking appointment for employee_id:", employee_id);  // Debugging log

    try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            throw new Error("Invalid date format");
        }

        let appointment = await Appointment.findOne({ date: parsedDate, time });

        if (!appointment) {
            const defaultMaxPatients = 5;
            appointment = new Appointment({
                date: parsedDate,
                time,
                maxPatients: defaultMaxPatients,
                currentPatients: 0
            });
            await appointment.save();
        }

        if (appointment.currentPatients >= appointment.maxPatients) {
            return res.status(400).send("<h1>No available slots for this appointment.</h1>");
        }

        const patientAppointment = new PatientAppointmentBooking({
            employee_id,
            date: parsedDate,
            time,
            reason,
            specialRequests,
        });

        await patientAppointment.save();

        appointment.currentPatients += 1;
        await appointment.save();

        res.send(`
            <h1>Appointment booked successfully!</h1>
            <p>Date: ${parsedDate.toDateString()}</p>
            <p>Time: ${time}</p>
            <p>Reason for Visit: ${reason}</p>
            <p>Special Requests: ${specialRequests}</p>
            <a href="/">Back to Home</a>
        `);
    } catch (error) {
        console.error("Error:", error.stack);
        res.status(500).send(`Server error while booking appointment: ${error.message}`);
    }
});

// Route to render the Add-Ons page with employee context
app.get('/add-ons/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    
    try {
        const employee = await Employee.findOne({ employee_id });
        
        if (employee) {
            res.render('addOns', { employee }); // Pass employee data to addOns.ejs
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});


app.listen(port,()=>{
    console.log("server started")
})