import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Link,
  Slide,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import Head from "next/head";
import Image from "next/image";
import Layout from "../components/Layout";
import getCommerce from "../utils/commerce";

export default function Home(props) {
  const { products } = props;

  return (
    <Layout title="" commercePublicKey={props.commercePublicKey}>
      {products.length === 0 && <Alert>No Product Found</Alert>}
      <Grid container spacing={1}>
        {products.map((item) => (
          <Grid item md={3} key={item.id}>
            <Slide direction="up" in={true}>
              <Card>
                <Link href={`products/${item.permalink}`}>
                  <CardActionArea>
                    <CardMedia
                      component="img"
                      alt={item.name}
                      image={item.media.source}
                    />
                    <CardContent>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="textPrimary"
                        component="p"
                      >
                        {item.name}
                      </Typography>
                      <Box>
                        <Typography
                          variant="body1"
                          color="textPrimary"
                          component="p"
                        >
                          {item.price.formatted_with_symbol}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Link>
              </Card>
            </Slide>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}

export async function getStaticProps() {
  const commerce = getCommerce();
  const { data: products } = await commerce.products.list();
  return {
    props: {
      products,
    },
  };
}
