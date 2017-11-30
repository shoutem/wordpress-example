import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { updateShortcutSettings } from '@shoutem/redux-api-sdk';
import { clear, isBusy } from '@shoutem/redux-io';
import { connect } from 'react-redux';

import {
  FEED_ITEMS,
  navigateToUrl,
  getFeedItems,
  fetchWordpressPosts,
} from 'src/redux';
import FeedUrlInput from 'src/components/feed-url-input';
import FeedPreview from 'src/components/feed-preview';
import './style.scss';
import ext from 'src/const';
import { validateWordpressUrl } from 'src/services/wordpress';

const ACTIVE_SCREEN_INPUT = 0;
const ACTIVE_SCREEN_PREVIEW = 1;

class WordpressFeedPage extends Component {
  constructor(props) {
    super(props);

    this.getActiveScreen = this.getActiveScreen.bind(this);
    this.saveFeedUrl = this.saveFeedUrl.bind(this);
    this.handleFeedUrlInputContinueClick = this.handleFeedUrlInputContinueClick.bind(this);
    this.handleFeedPreviewRemoveClick = this.handleFeedPreviewRemoveClick.bind(this);

    const feedUrl = _.get(props.shortcut, 'settings.feedUrl');
    const categoryName = _.get(props.shortcut, 'settings.categoryName');
    this.state = {
      error: null,
      hasChanges: false,
      feedUrl,
      categoryName,
    };

    this.fetchPosts({ feedUrl });
  }

  componentWillReceiveProps(nextProps) {
    const { shortcut: nextShortcut } = nextProps;
    const { feedUrl } = this.state;

    // Must be check with "undefined" because _.isEmpty() will validate this clause
    // when feedUrl === null which is set when we want to clear { feedUrl } and this causes feedUrl
    // to be set even when user removed it.
    if (feedUrl === undefined) {
      const nextFeedUrl = _.get(nextShortcut, 'settings.feedUrl');

      this.setState({
        feedUrl: nextFeedUrl,
      });

      if (nextFeedUrl && validateWordpressUrl(nextFeedUrl)) {
        nextProps.fetchWordpressPosts({ feedUrl: nextFeedUrl, shortcutId: nextShortcut.id });
      }
    }
  }

  getActiveScreen() {
    const { feedUrl } = this.state;
    if (!_.isEmpty(feedUrl)) {
      return ACTIVE_SCREEN_PREVIEW;
    }
    return ACTIVE_SCREEN_INPUT;
  }

  saveFeedUrl(feedUrl, categoryName) {
    const { shortcut } = this.props;
    const settings = { feedUrl, categoryName };

    if (!_.isEmpty(feedUrl) && !validateWordpressUrl(feedUrl)) {
      this.setState({ error: 'Invalid URL', inProgress: false });
      return;
    }

    this.setState({ error: '', inProgress: true });
    this.props.updateShortcutSettings(shortcut, settings).then(() => {
      this.setState({ hasChanges: false, inProgress: false });
    }).catch((err) => {
      this.setState({ error: err, inProgress: false });
    });
  }

  fetchPosts({ feedUrl }) {
    const { shortcut } = this.props;

    if (!feedUrl || !shortcut || !validateWordpressUrl(feedUrl)) {
      return;
    }

    this.props.fetchWordpressPosts({
      feedUrl,
      shortcutId: shortcut.id,
    });
  }

  handleFeedUrlInputContinueClick(feedUrl, categoryName) {
    this.setState({
      feedUrl,
      categoryName,
    });
    this.saveFeedUrl(feedUrl, categoryName);
    this.fetchPosts({ feedUrl });
  }

  handleFeedPreviewRemoveClick() {
    this.setState({
      feedUrl: '',
    });

    this.saveFeedUrl('');
    this.props.clearFeedItems();
  }

  render() {
    const activeScreen = this.getActiveScreen();
    const { feedUrl, categoryName } = this.state;
    const { feedItems, navigateToUrl } = this.props;

    return (
      <div className="wordpress-feed-page">
        {(activeScreen === ACTIVE_SCREEN_INPUT) && (
          <FeedUrlInput
            inProgress={isBusy(feedItems)}
            error={this.state.error}
            onContinueClick={this.handleFeedUrlInputContinueClick}
          />
        )}
        {(activeScreen === ACTIVE_SCREEN_PREVIEW) && (
          <div>
            <FeedPreview
              feedUrl={`${feedUrl} - ${categoryName}`}
              feedItems={feedItems}
              onRemoveClick={this.handleFeedPreviewRemoveClick}
              onLinkClick={navigateToUrl}
            />
          </div>
        )}
      </div>
    );
  }
}

WordpressFeedPage.propTypes = {
  shortcut: PropTypes.object,
  feedItems: PropTypes.array,
  fetchShortcut: PropTypes.func,
  updateShortcutSettings: PropTypes.func,
  loadFeed: PropTypes.func,
  clearFeedItems: PropTypes.func,
  fetchWordpressPosts: PropTypes.func,
};

WordpressFeedPage.defaultProps = {
  feedItems: [],
};


function mapStateToProps(state, ownProps) {
  const { shortcut, shortcutId } = ownProps;
  const extensionName = ext();

  return {
    feedItems: getFeedItems(state, extensionName, shortcutId),
    shortcut,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateShortcutSettings: (shortcut, { feedUrl, categoryName }) => (
      dispatch(updateShortcutSettings(shortcut, { feedUrl, categoryName }))
    ),
    clearFeedItems: () => dispatch(clear(FEED_ITEMS, 'feedItems')),
    fetchWordpressPosts: (params) => dispatch(fetchWordpressPosts(params)),
    navigateToUrl: (url) => dispatch(navigateToUrl(url)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(WordpressFeedPage);
