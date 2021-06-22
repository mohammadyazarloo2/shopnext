import Commerce from '@chec/commerce.js'

let commerce=null

function getCommerce(commercePublicKey){
    if(commerce){
        return commerce
    }else{
        const publicKey=commercePublicKey || process.env.COMMERCE_PUBLIC_KEY
        const devEnviorment=process.env.NODE_ENV === 'development'
        if(devEnviorment && !publicKey){
            throw Error('commerce public key not found')
        }
        commerce=new Commerce(publicKey,devEnviorment)
        return commerce
    }
}

export default getCommerce