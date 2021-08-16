require( 'dotenv' ).config()

const express = require( 'express' )
const app = express()
const Authenticate = require( './Authenticate' )

app.use( '/authenticate', Authenticate )

app.listen( process.env.PORT, () => {
    console.log( 'Server Running Successfully at Port: ' + process.env.PORT )
} )