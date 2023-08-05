const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { get } = require('mongoose');

app.use(express.json());
const SECRET = "42069Super"
let ADMINS = [];
let USERS = [];
let COURSES = [];


const getJwt = (req, res, next) => {
  const auth = req.headers.authorization;
  if(auth){
    const token = auth.split(' ')[1];
    jwt.verify(token, SECRET, (err, user)=>{
      if(err){
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    })
  }
  else{
    res.sendStatus(401);
  }
};


// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  
  var data = req.body;
  const admin = ADMINS.find(a => a.username === data.username);
  if(admin){
    res.status(403).json({message: "Admin already exists"});
  }
  else{
    var dataObj = {
      username: data.username,
      password: data.password
    }
    ADMINS.push(dataObj)
    var token = jwt.sign(dataObj, SECRET);
    res.json({
      Message: "Admin Created succesfully",
      Bearer: token
    })
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const data = req.headers;
  var admin = ADMINS.find(a=> a.username === data.username && a.password === data.password);
  if(admin){
    var token = jwt.sign({username: data.username}, SECRET);
    res.send({Message: "Admin Login successful", token: token});
  }
  else{
    res.status(403).json({message: "Invalid login credentials"})
  }
});

app.post('/admin/courses',getJwt, (req, res) => {
  // logic to create a course
  const course = req.body;
  if(course){
  var courseID = COURSES.length + 1;
  COURSES.push(course);
  res.json({message : "Course Created succesfully"});
  }
  else{
    res.status(404).json({message: "Can't create an empty course."})
  }

});

app.put('/admin/courses/:courseId',getJwt, (req, res) => {
  // logic to edit a course
  const course = COURSES.find(a=>a.id === parseInt(req.params.courseId))
  if(course){
    Object.assign(course, req.body);
    res.json("Course Updated Succesfully")
  }else{
    res.sendStatus(404).json({message: "Course not found"})
  }
});

app.get('/admin/courses',getJwt, (req, res) => {
  // logic to get all courses
  res.json({courses: COURSES})
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  var dataObj = {
    username : req.body.username,
    password : req.body.password
  }
  const user = USERS.find(a => a.username === req.body.username)
  if(user){
    res.sendStatus(403).json({message: "User already exists"})
  }else{
  var token = jwt.sign(dataObj, SECRET);
  USERS.push(dataObj)
  res.json({message: "User cretated successfully", Bearer: token})
  }

});

app.post('/users/login', (req, res) => {
  // logic to log in user
  
  const { username, password } = req.headers;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user){
    const token = jwt.sign({username, role: "user"}, SECRET)
    res.json({message: "User login succesful", token : token})
  }
  else{
    res.status(403).json({message: "Login credentials invalid"});
  }
});

app.get('/users/courses', authenticateJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.post('/users/courses/:courseId', authenticateJwt, (req, res) => {
  const course = COURSES.find(c => c.id === parseInt(req.params.courseId));
  if (course) {
    const user = USERS.find(u => u.username === req.user.username);
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(course);
      fs.writeFileSync('users.json', JSON.stringify(USERS));
      res.json({ message: 'Course purchased successfully' });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', authenticateJwt, (req, res) => {
  const user = USERS.find(u => u.username === req.user.username);
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
