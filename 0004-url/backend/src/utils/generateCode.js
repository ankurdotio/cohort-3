import crypto from "crypto"


/**
 * Generates a 6 character long unique short code for URLs which contains on a-z, A-Z, and 0-9.
 */
const generateCode = () => {

    const mainString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    let shortCode = ""

    for (let i = 0; i < 6; i++) {
        shortCode += mainString.charAt(Math.floor(Math.random() * 62))
    }

    return shortCode
}

export default generateCode