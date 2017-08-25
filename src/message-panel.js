/**
 * Created by colinhan on 04/03/2017.
 */

import React, {Component, PropTypes} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  TouchableHighlight,
} from 'react-native';

import _ from 'underscore';

const client = require('p2m-message-client');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  rowSeparator: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1,
    marginLeft: 4,
  },
});


export default class MessagePanel extends Component {
  constructor(props, context) {
    super(props, context);
    let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      isHudVisible: false,
      messages: ds.cloneWithRows([]),
      page: 0,
      cacheData: []
    };

    this.refresh = _.throttle(this._refresh.bind(this), 100);
  }

  componentDidMount() {
    this._refresh();
    client.on('message', this.refresh)
          .on('unreadChange', this.refresh);
  }
  componentDidUnmount() {
    client.off('message', this.refresh)
          .off('unreadChange', this.refresh);
  }
  componentDidUpdate() {
    if (this._currentFilter !== this.props.filter) {
      this._refresh();
    }
  }

  _refresh() {
    console.log('[MESSAGE-PANEL] Refresh message panel.');
    if(this.refs._messageListView) {
      this.refs._messageListView.scrollTo(0);
    }
    
    this._currentFilter = this.props.filter;

    this.context.showProgress();

    client.messages({filter: this.props.filter, page: 0}).then(messages => {
      this.setState({
        messages: this.state.messages.cloneWithRows(messages.displayMessages),
        page: 0,
        cacheData: messages.displayMessages
      });
      this.context.dismissProgress();
    });
  }

  _getNextPage() {
    console.log('[MESSAGE-PANEL] Get Next Page messages.');
    this._currentFilter = this.props.filter;

    this.context.showProgress();

    client.messages({filter: this.props.filter, page: this.state.page + 1}).then(messages => {
      let allMessages = [...this.state.cacheData, ...messages.displayMessages];
      this.setState({
        cacheData: allMessages,
        messages: this.state.messages.cloneWithRows(allMessages),
        page: this.state.page + 1
      });
      this.context.dismissProgress();
    });
  }

  renderRow(rowData, sectionId, rowId, highlightRow) {
    return (
        <TouchableHighlight
            underlayColor="#BD1E2210"
            activeOpacity={0.9}
            onPress={()=> {
              this.pressRow(rowData);
            }}
        >
          <View>{this.props.renderMessage(rowData)}</View>
        </TouchableHighlight>
    );
  }

  pressRow(rowData) {
    if (!rowData.isRead) {
      client.read(rowData.sendId)
          .then(this._refresh.bind(this));
    }

    if (this.props.pressMessage) {
      this.props.pressMessage(rowData);
    }
  }

  renderSeparator(sectionID, rowID) {
    let style = styles.rowSeparator;
    return (
        <View key={'SEP_' + sectionID + '_' + rowID} style={style}/>
    );
  }

  render() {
    return (
        <View style={styles.container}>
          <ListView style={this.state.content}
                    ref="_messageListView"
                    dataSource={this.state.messages}
                    renderRow={this.renderRow.bind(this)}
                    renderSeparator={this.renderSeparator.bind(this)}
                    onEndReached={this._getNextPage.bind(this)}
                    onEndReachedThreshold={10}
                    automaticallyAdjustContentInsets={false}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}>
          </ListView>
        </View>
    )
  }
}

MessagePanel.contextTypes = {
  showProgress: PropTypes.func,
  dismissProgress: PropTypes.func,
};

MessagePanel.propTypes = {
  renderMessage: PropTypes.func.isRequired,
  titleBorderColor: PropTypes.string,
  rowSeparatorColor: PropTypes.string,
  pressMessage: PropTypes.func,
};