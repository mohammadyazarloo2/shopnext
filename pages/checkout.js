import {
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  Link,
  List,
  ListItem,
  MenuItem,
  Select,
  Slide,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import Head from "next/head";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Store } from "../components/Store";
import getCommerce from "../utils/commerce";
import { useStyle } from "../utils/styles";
import dynamic from "next/dynamic";
import { CART_RETRIEVE_SUCCESS, ORDER_SET } from "../utils/constants";
import Router from "next/dist/next-server/lib/router/router";

const dev = process.env.NODE_ENV === "development";
function Checkout(props) {
  const { products } = props;
  const classes = useStyle();
  const { state, dispatch } = useContext(Store);
  const { cart } = state;

  useEffect(() => {
    if (!cart.loading) {
      generateCheckoutToken();
    }
  }, cart.loading);

  const generateCheckoutToken = async () => {
    if (cart.data.line_items.length) {
      const commerce = getCommerce(props.commercePublicKey);
      const token = await commerce.checkout.generateToken(cart.data.id, {
        type: "cart",
      });
      setCheckoutToken(token);
      fetchShippingCountries(token.id);
    } else {
      Router.push("/cart");
    }
  };

  //customer details
  const [firstname, setFirstName] = useState(dev ? "jone" : "");
  const [lastname, setLastName] = useState(dev ? "doe" : "");
  const [email, setEmail] = useState(dev ? "joedoe@gmail.com" : "");

  //shipping details
  const [shippingname, setShippingName] = useState(dev ? "jone doe" : "");
  const [shippingstreet, setShippingStreet] = useState(
    dev ? "123 fake st" : ""
  );
  const [shippingPostalCode, setShippingPostalCode] = useState(
    dev ? "90089" : ""
  );
  const [shippingCity, setShippingCity] = useState(dev ? "los angles" : "");
  const [shippingStateProvince, setShippingStateProvince] = useState(
    dev ? "Ar" : ""
  );
  const [shippingCountry, setShippingCountry] = useState(dev ? "GB" : "");
  const [shippingOption, setShippingOption] = useState({});

  //payment details
  const [cardNum, setCardNum] = useState(dev ? "4242 4242 4242 4242" : "");
  const [expMonth, setExpMonth] = useState(dev ? "11" : "");
  const [expYear, setExpYear] = useState(dev ? "2021" : "");
  const [cvv, setCvv] = useState(dev ? "ok" : "");
  const [biilingPostalZipCode, setBillingPostalZipCode] = useState(
    dev ? "90089" : ""
  );

  //shipping and fullfillment data
  const [shippingCountries, setShippingCountries] = useState({});
  const [shippingSubdivions, setShippingSubdivion] = useState({});
  const [shippingOptions, setShippingOptions] = useState([]);

  //steper
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "customer information",
    "shipping details",
    "payment information",
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    if (activeStep === steps.length + 1) {
      handleCaptureCheckout();
    }
  };

  const handleCaptureCheckout = async () => {
    const orderData = {
      line_items: checkoutToken.live.line_items,
      customer: {
        firstname: firstname,
        lastname: lastname,
        email: email,
      },
      shipping: {
        name: shippingname,
        street: shippingstreet,
        tow_city: shippingCity,
        country_state: shippingStateProvince,
        postal_zip_code: shippingPostalCode,
        country: shippingCountry,
      },
      fulFillment: {
        shipping_method: shippingOption,
      },
      payment: {
        gateway: "test_gateway",
        card: {
          number: cardNum,
          expire_month: expMonth,
          expire_year: expYear,
          cvv: cvv,
          postal_zip_code: biilingPostalZipCode,
        },
      },
    };
    const commerce=getCommerce(props.commercePublicKey)
    try {
      const order=await commerce.checkout.capture(
        checkoutToken.id,
        orderData,
      )
      dispatch({type:ORDER_SET,payload:order})
      localStorage.setItem('order_receipt',JSON.stringify(order))
      await refreshCart()
      Router.push('/confirmation')
    } catch (err) {
      const errList=[err.data.error.message]
      const errs=err.data.error.errors
      for(const index in errs){
        errList.push(`${index}: ${errs[index]}`)
      }
      setErrors(errList)
    }
  };

  const refreshCart=async()=>{
    const commerce=getCommerce(props.commercePublicKey)
    const newCart=await commerce.cart.refresh()
    dispatch({type:CART_RETRIEVE_SUCCESS,payload:newCart})
  }

  const [errors, setErrors] = useState([]);
  const [checkoutToken, setCheckoutToken] = useState({});

  const handleBack = () => {
    setErrors([]);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleShippingCountryChange = (e) => {
    const currentValue = e.target.value;
    setShippingCountry(e.target.value);
    fetchSubdivisions(currentValue);
  };

  const fetchShippingCountries = async (checkoutTokenId) => {
    const commerce = getCommerce(props.commercePublicKey);
    const countries = await commerce.services.localeListShippingCountries(
      checkoutTokenId
    );
    setShippingCountries(countries.countries);
  };

  const fetchSubdivisions = async (countryCode) => {
    const commerce = getCommerce(props.commercePublicKey);
    const subdivisions = await commerce.services.localeListSubdivisions(
      countryCode
    );
    setShippingSubdivion(subdivisions.subdivisions);
  };

  const handleSubdivisionChange = (e) => {
    const currentValue = e.target.value;
    setShippingStateProvince(currentValue);
    fetchShippingOption(checkoutToken.id, shippingCountry, currentValue);
  };

  const handleShippingOptionchange = (e) => {
    const currentValue = e.target.value;
    setShippingOption(currentValue);
    console.log(currentValue);
  };

  const fetchShippingOption = async (
    checkoutTokenId,
    country,
    stateProvince = null
  ) => {
    const commerce = getCommerce(props.commercePublicKey);
    const options = await commerce.checkout.getShippingOptions(
      checkoutTokenId,
      {
        country: country,
        region: stateProvince,
      }
    );
    setShippingOptions(options);
    const shippingOption = options[0] ? options[0].id : null;
    setShippingOption(shippingOption);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="firstname"
              lable="نام"
              name="firstname"
              value={firstname}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="lastname"
              lable="نام خانوادگی"
              name="lastname"
              value={lastname}
              onChange={(e) => setLastName(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              lable="پست الکترونیک"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="shippingname"
              lable="shipping name"
              name="shippingname"
              value={shippingname}
              onChange={(e) => setShippingName(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="shippingstreet"
              lable="shipping street"
              name="shippingstreet"
              value={shippingstreet}
              onChange={(e) => setShippingStreet(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="shippingCity"
              lable="shipping City"
              name="shippingCity"
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="shippingPostalCode"
              lable="shipping Postal Code"
              name="shippingPostalCode"
              value={shippingPostalCode}
              onChange={(e) => setShippingPostalCode(e.target.value)}
            />
            <FormControl className={classes.formControl}>
              <InputLabel id="shippingCountry-label">Country</InputLabel>
              <Select
                lableId="shippingCountry-label"
                id="shippingCountry"
                lable="Country"
                fullWidth
                required
                onChange={handleShippingCountryChange}
                value={shippingCountry}
              >
                {Object.keys(shippingCountries).map((index) => (
                  <MenuItem value={index} key={index}>
                    {shippingCountries[index]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel id="shippingStateProvince-label">
                State / Province
              </InputLabel>
              <Select
                lableId="shippingStateProvince-label"
                id="shippingStateProvince-label"
                lable="State / Province"
                fullWidth
                onChange={handleSubdivisionChange}
                required
                value={shippingStateProvince}
                className={classes.mt1}
              >
                {Object.keys(shippingSubdivions).map((index) => (
                  <MenuItem value={index} key={index}>
                    {shippingSubdivions[index]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel id="shippingOptions-label">
                shipping Options
              </InputLabel>
              <Select
                lableId="shippingOptions-label"
                id="shippingOptions-label"
                lable="Shipping Options"
                fullWidth
                onChange={handleShippingOptionchange}
                required
                value={shippingOption}
                className={classes.mt1}
              >
                {shippingOptions.map((method, index) => (
                  <MenuItem value={method.id} key={index}>
                    {`${method.description} - $${method.price.formatted_with_code}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );
      case 2:
        return (
          <>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="cardNum"
              lable="شماره کارت"
              name="cardNum"
              value={cardNum}
              onChange={(e) => setCardNum(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="expMonth"
              lable="ماه اتمام"
              name="expMonth"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="expYear"
              lable="سال اتمام"
              name="expYear"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="cvv"
              lable="cvv"
              name="cvv"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="biilingPostalZipCode"
              lable="کدپستی"
              name="biilingPostalZipCode"
              value={biilingPostalZipCode}
              onChange={(e) => setBillingPostalZipCode(e.target.value)}
            />
          </>
        );
      default:
        return "unknown step";
    }
  };

  return (
    <Layout title="" commercePublicKey={props.commercePublicKey}>
      <Typography gutterBottom variant="h6" color="textPrimary" component="h1">
        پرداخت و فاکتور محصول
      </Typography>
      {cart.loading ? (
        <CircularProgress />
      ) : (
        <Grid container>
          <Grid item md={8}>
            <Card className={classes.p1}>
              <form>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel> {label} </StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Box>
                  {activeStep === steps.length ? (
                    errors && errors.length > 0 ? (
                      <Box>
                        <List>
                          {errors.map((error) => (
                            <ListItem key={error}>
                              <Alert severity="error"> {error} </Alert>
                            </ListItem>
                          ))}
                        </List>
                        <Box className={classes.mt1}>
                          <Button
                            onClick={handleBack}
                            className={classes.button}
                          >
                            بازگشت
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <CircularProgress />
                        <Typography className={classes.instructions}>
                          ثبت سفارش
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <Box>
                      {getStepContent(activeStep)}
                      <Box className={classes.mt1}>
                        <Button
                          disabled={activeStep === 0}
                          onClick={handleBack}
                          className={classes.button}
                        >
                          بازگشت
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleNext}
                          className={classes.button}
                        >
                          {activeStep === steps.length - 1
                            ? "ثبت سفارش"
                            : "مرحله بعد"}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </form>
            </Card>
          </Grid>

          <Grid item md={4}>
            <Card>
              <List>
                <ListItem>
                  <Typography variant="h2"> خلاصه سفارش </Typography>
                </ListItem>
                {cart.data.line_items.map((lineItem) => (
                  <ListItem key={lineItem.id}>
                    <Grid container>
                      <Grid item xs={6} align="right">
                        {lineItem.quantity} x {lineItem.name}
                      </Grid>
                      <Grid item xs={6}>
                        <Typography align="left">
                          {lineItem.line_total.formatted_with_symbol}
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
                <ListItem>
                  <Grid container>
                    <Grid item xs={6} align="right">
                      جمع کل
                    </Grid>
                    <Grid item xs={6} align="left">
                      {cart.data.subtotal.formatted_with_symbol}
                    </Grid>
                  </Grid>
                </ListItem>
              </List>
            </Card>
          </Grid>
        </Grid>
      )}
    </Layout>
  );
}

export default dynamic(() => Promise.resolve(Checkout), {
  ssr: false,
});
