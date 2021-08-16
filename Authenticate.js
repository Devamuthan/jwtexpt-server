require( 'dotenv' ).config()

const express = require( 'express' )
const bodyParser = require( "body-parser" );
const jwt = require( "jsonwebtoken" );
const router = express.Router()

router.use( bodyParser.json() )
router.use( bodyParser.urlencoded( { extended: false } ) )

const accounts = [
    {
        'id': '001',
        'name': 'deva',
        'password': 'deva'
    },
    {
        'id': '002',
        'name': 'abdul',
        'password': 'abdul'
    },
    {
        'id': '003',
        'name': 'sola',
        'password': 'sola'
    }
]

let refreshTokens = []

router.post( '/login', ( req, res ) => login( req, res ) )

router.post( '/refreshToken', ( req, res ) => refreshAuthToken( req, res ) )

router.post( '/logout', ( req, res ) => logout( req, res ) )

router.post( '/tokenAuth', authorizeToken, ( req, res ) => {
    console.log( "Entering | Authenticate::tokenAuth" )
    if ( req.auth ) {
        const account = accounts.filter( acc => req.id === acc.id )[ 0 ]
        if ( account != null ) {
            res.json( {
                auth: true,
                id: account.id,
                name: account.name
            } )
        } else {
            res.json( { auth: false } )
        }
    } else {
        res.json( { auth: false } )
    }
    console.log( "Exiting | Authenticate::tokenAuth" )
    res.end()
} )

function login( req, res ) {
    console.log( "Entering | Authenticate::login" )
    const username = req.body.username
    const password = req.body.password
    const account = accounts.filter( acc => acc.name === username && acc.password === password )[ 0 ]
    if ( account == null ) {
        res.json( { auth: false } )
    } else {
        const authToken = createAuthToken( { id: account.id } )
        const refreshToken = createRefreshToken( { id: account.id } )
        res.json( {
            auth: true,
            authToken: authToken,
            refreshToken: refreshToken,
            data: {
                id: account.id,
                name: account.name
            }
        } )
    }
    console.log( "Exiting | Authenticate::login" )
    res.end()
}

function authorizeToken( req, res, next ) {
    console.log( "Entering | Authenticate::authorizeToken" )
    const authHeader = req.headers[ 'authorization' ]
    const token = authHeader && authHeader.split( ' ' )[ 1 ]
    if ( token == null ) req.auth = false
    jwt.verify( token, process.env.ACCESS_SECRET_KEY, ( err, user ) => {
        if ( err ) {
            req.auth = false
        } else {
            req.auth = true
            req.id = user.id
        }
    } )
    console.log( "Entering | Authenticate::authorizeToken" )
    next()
}

function refreshAuthToken( req, res ) {
    console.log( "Entering | Authenticate::refreshAuthToken" )
    const authHeader = req.headers[ 'authorization' ]
    const token = authHeader.split( ' ' )[ 1 ]
    if ( token != null && refreshTokens.includes( token ) ) {
        jwt.verify( token, process.env.REFRESH_SECRET_KEY, ( err, user ) => {
            if ( err ) {
                res.json( {
                    description: "Invalid Refresh Token"
                } )
            } else {
                const authToken = createAuthToken( { id: user.id } )
                res.json( {
                    authToken: authToken
                } )
            }
        } )
    } else {
        res.json( {
            description: "Invalid Refresh Token"
        } )
    }
    console.log( "Exiting | Authenticate::refreshAuthToken" )
    res.end()
}

function logout( req, res ) {
    console.log("Entering | Authenticate::logout")
    const token = req.body.token
    if(token != null && refreshTokens.includes(token)){
        refreshTokens = refreshTokens.filter(refreshToken => token !== refreshToken)
        res.json({auth: false})
    }else{
        res.json({
            description: "Invalid Refresh Token"
        })
    }

    console.log("Exiting | Authenticate::logout")
    res.end()
}

function createAuthToken( id ) {
    console.log( "Entering | Authenticate::createAuthToken" )
    const authToken = jwt.sign( id, process.env.ACCESS_SECRET_KEY, { expiresIn: "20s" } )
    console.log( "Exiting | Authenticate::createAuthToken" )
    return authToken
}

function createRefreshToken( id ) {
    console.log( "Entering | Authenticate::createRefreshToken" )
    const refreshToken = jwt.sign( id, process.env.REFRESH_SECRET_KEY )
    refreshTokens.push( refreshToken )
    console.log( "Exiting | Authenticate::createRefreshToken" )
    return refreshToken
}

module.exports = router