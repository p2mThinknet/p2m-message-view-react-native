/**
 * Created by colinhan on 21/03/2017.
 */

import React, {Component, PropTypes} from 'react';
import {
  Text,
  View
} from 'react-native';
import IconBadge from 'react-native-icon-badge';
import Icon from 'react-native-vector-icons/Ionicons';
const client = require('p2m-message-client');

export default class MessageBell extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      unreadCount: 0
    };

    client.on('unreadChange', this.refresh.bind(this));
  }

  componentDidMount() {
    this.refresh();
  }

  refresh() {
    client.unreadCount().then((count) => {
      this.setState({
        unreadCount: count
      });
    });
  }

  render() {
    let count = this.state.unreadCount;
    if (count > 10) {
      count = "10+";
    }
    let size = 16;
    if (!count) {
      size = 0;
    }
    return (
        <IconBadge
            MainElement={
              <View style={{width: 29, height: 25}}>
                <Icon style={{color: this.props.color, textAlign: 'center'}} name="ios-chatboxes" size={25}/>
              </View>
            }
            BadgeElement={
              <Text style={{color: '#FFFFFF', fontSize: 8}}>{count}</Text>
            }
            IconBadgeStyle={{width: size, height: size}}
        />
    );
  }
}
MessageBell.propTypes = {
  color: PropTypes.string,
};