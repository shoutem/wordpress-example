import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { connectStyle } from '@shoutem/theme';
import { NavigationBar } from '@shoutem/ui/navigation';
import { Screen, Spinner, Image } from '@shoutem/ui';

import {
  ProductsListScreen,
  mapStateToProps,
  mapDispatchToProps,
} from 'shoutem.shopify/screens/ProductsListScreen';

import { ext } from '../const';

export class FeaturedProductsList extends ProductsListScreen {
  render() {
    const { collection = {}, shop } = this.props;
    const { collections, isLoading } = shop;

    return (
      <Screen>
        <NavigationBar {...this.getNavBarProps()} />
        <Image
          styleName="large-wide"
          source={{
            uri: 'http://thebeyondstudios.com/wp-content/uploads/2015/11/Black-Friday1.jpg',
          }}
        />
        {!_.isEmpty(collections) &&
          this.renderCollectionsPicker()
        }
        {isLoading ?
          <Spinner style={{ marginTop: 20 }} /> :
          this.renderProducts(collection.id)
        }
      </Screen>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(
  connectStyle(ext('FeaturedProductsList'))(FeaturedProductsList),
);

