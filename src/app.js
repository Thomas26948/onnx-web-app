const express = require('express')
const path = require('path')

const hbs = require('hbs')

const app = express()
const port = process.env.PORT || 3000

const viewsPath = path.join(__dirname,'../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')


//Setp handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

app.use(express.static(path.join(__dirname,'../public')))


app.get('',(req,res)=>{
  res.render('index',{
      title: 'Image Processing Web App',
      name: 'Tomlak'
  })
})


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});