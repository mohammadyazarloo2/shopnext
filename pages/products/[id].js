import {
  Box,
  Button,
  Card,
  Grid,
  Link,
  List,
  ListItem,
  MenuItem,
  Select,
  Slide,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import Head from "next/head";
import Image from "next/image";
import React, { useContext, useState } from "react";
import Layout from "../../components/Layout";
import { Store } from "../../components/Store";
import getCommerce from "../../utils/commerce";
import { CART_RETRIEVE_SUCCESS } from "../../utils/constants";
import { useStyle } from "../../utils/styles";
import Router from 'next/router'

export default function Product(props) {
  const { product } = props;
  const [quantity, setQuantity] = useState(1);
  const classes = useStyle();
  
  const {state,dispatch}=useContext(Store)
  const {cart}=state

  const addToCartHandle = async () => {
    const commerce=getCommerce(props.commercePublicKey)
    const lineItem=cart.data.line_items.find(
      (x)=>x.product_id===product.id
    )
    if(lineItem){
      const cartData=await commerce.cart.update(lineItem.id,{
        quantity:quantity,
      })
      dispatch({type:CART_RETRIEVE_SUCCESS,payload:cartData.cart})
      Router.push('/cart')
    }else{
      const cartData=await commerce.cart.add(product.id,quantity)
      dispatch({type:CART_RETRIEVE_SUCCESS,payload:cartData.cart})
      Router.push('/cart')
    }
  };

  return (
    <Layout title={product.name} commercePublicKey={props.commercePublicKey}>
      <Slide direction="up" in={true}>
        <Grid container spacing={1}>
          <Grid item md={6}>
            <img
              src={product.media.source}
              alt={product.name}
              className={classes.largeImage}
            />
          </Grid>

          <Grid item md={3} xs={12}>
            <List>
              <ListItem>
                <Typography
                  gutterBottom
                  variant="h6"
                  color="textPrimary"
                  component="h1"
                >
                  {product.name}
                </Typography>
              </ListItem>
              <ListItem>
                <Box
                  dangerouslySetInnerHTML={{ __html: product.description }}
                ></Box>
              </ListItem>
            </List>
          </Grid>

          <Grid item md={3} xs={12}>
            <Card>
              <List>
                <ListItem>
                  <Grid container>
                    <Grid item xs={6}>
                      Price
                    </Grid>
                    <Grid item xs={6}>
                      {product.price.formatted_with_symbol}
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Grid alignItems="center" container>
                    <Grid item xs={6}>
                      Status
                    </Grid>
                    <Grid item xs={6}>
                      {product.inventory.available > 0 ? (
                        <Alert icon={false} severity="success">
                          موجود در انبار
                        </Alert>
                      ) : (
                        <Alert icon={false} severity="error">
                          در دسترس نیست
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                </ListItem>
                {product.inventory.available > 0 && (
                  <>
                    <ListItem>
                      <Grid container justify="flex-end">
                        <Grid item xs={6}>
                          quantity
                        </Grid>
                        <Grid item xs={6}>
                          <Select
                            labelId="quantity-label"
                            id="quantity"
                            fullWidth
                            onChange={(e) => setQuantity(e.target.value)}
                            value={quantity}
                          >
                            {[...Array(product.inventory.available).keys()].map((x) => (
                              <MenuItem key={x + 1} value={x + 1}>
                                {x + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </Grid>
                      </Grid>
                    </ListItem>
                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={addToCartHandle}
                    >
                      افزودن به سبد خرید
                    </Button>
                  </>
                )}
              </List>
            </Card>
          </Grid>
        </Grid>
      </Slide>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const { id } = params;
  const commerce = getCommerce();
  const product = await commerce.products.retrieve(id, {
    type: "permalink",
  });
  return {
    props: {
      product,
    },
  };
}
