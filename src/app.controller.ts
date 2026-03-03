import { Controller, Post, Inject, Body } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    @Inject('MATH_SERVICE')
    private readonly mathClient: ClientProxy,
    @Inject('ORDER_SERVICE')
    private readonly orderClient: ClientProxy,
  ) {}

 @Post('sum')
 sum(@Body() { data }): Observable<number> {
   return this.mathClient.send({ cmd: 'sum' }, data);
 }

 @Post('order')
  createOrder() {
    return this.orderClient.send(
      { cmd: 'create-order' },
      {
        userId: 1,
        product: 'iPhone',
      },
    );
  }
}