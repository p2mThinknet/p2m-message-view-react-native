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
      page: 0
    };

    let refresh = _.throttle(this._refresh.bind(this), 100);
    client.on('message', refresh)
        .on('unreadChange', refresh);
  }

  componentDidMount() {
    this._refresh();
  }
  componentDidUpdate() {
    if (this._currentFilter !== this.props.filter) {
      this._refresh();
    }
  }

  _refresh() {
    console.log('[MESSAGE-PANEL] Refresh message panel.');
    this._currentFilter = this.props.filter;

    this.context.showProgress();

    client.messages({filter: this.props.filter}).then(messages => {
      this.setState({
        messages: this.state.messages.cloneWithRows(messages.displayMessages),
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

  onEndReached() {
    this.setState({
        page: this.state.page += 1
      });
    this._refresh();
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
                    dataSource={this.state.messages}
                    renderRow={this.renderRow.bind(this)}
                    renderSeparator={this.renderSeparator.bind(this)}
                    onEndReached={this.onEndReached.bind(this)}
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