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

const name = 'Tomlak & Brothers'
const title = '✨ Personnal AI Photo Studio ✨'

app.get('',(req,res)=>{
  res.render('index',{
      title: title,
      name: name
  })
})

app.get('/about',(req,res)=>{
  res.render('about',{
    title: title,
    name: name
  })
})

app.get('/boost',(req,res)=>{
  res.render('boost',{
    title: title,
    name: name
  })
})



app.get('/erazer',(req,res)=>{
  res.render('erazer',{
    title: title,
    name: name
  })
})


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


